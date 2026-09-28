import { storageConfigArgs } from "./lib/wrangler.ts";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import sharp from "sharp";
import { assertPublicHttpsUrl } from "../src/lib/catalog-enrichment/url-policy.ts";
import { serverScreenshotClient } from "./lib/server-screenshot.ts";

const execute = promisify(execFile);
const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const mode = process.argv.includes("--remote") ? "--remote" : "--local";
const replaceExisting = process.argv.includes("--all");
const dryRun = process.argv.includes("--dry-run");
const includePending = process.argv.includes("--include-pending");
const targetToolId = process.argv.find((argument) => argument.startsWith("--tool-id="))?.slice("--tool-id=".length);
const screenshotFile = process.argv.find(argument => argument.startsWith("--screenshot-file="))?.slice("--screenshot-file=".length);
if (screenshotFile && !targetToolId) throw new Error("A supplied screenshot requires --tool-id.");
const width = 1440;
const height = 900;

if (process.argv.includes("--local") && process.argv.includes("--remote")) {
  throw new Error("Choose either --local or --remote, not both.");
}

type ToolRow = {
  id: string;
  slug: string;
  name: string;
  website_url: string;
  screenshot_asset_key: string | null;
};

function sql(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

async function wrangler(args: string[]) {
  const result = await execute("pnpm", ["exec", "wrangler", ...args, ...storageConfigArgs(projectRoot, args)], {
    cwd: projectRoot,
    maxBuffer: 10 * 1024 * 1024,
  });
  return result.stdout;
}

async function d1(command: string) {
  const output = await wrangler(["d1", "execute", "DB", mode, "--json", "--command", command]);
  return JSON.parse(output) as Array<{ results?: unknown[] }>;
}

async function readTools() {
  const condition = replaceExisting ? "" : "AND screenshot_asset_key IS NULL";
  const status = includePending ? "status IN ('published', 'pending_review')" : "status = 'published'";
  const target = targetToolId ? `AND id = ${sql(targetToolId)}` : "";
  const result = await d1(
    `SELECT id, slug, name, website_url, screenshot_asset_key FROM tools WHERE ${status} ${condition} ${target} ORDER BY name`,
  );
  return (result[0]?.results ?? []) as ToolRow[];
}

async function capture(tool: ToolRow) {
  const website = assertPublicHttpsUrl(tool.website_url);
  const input = screenshotFile ? await readFile(screenshotFile) : await client!.capture(website.href);
  const bytes = await sharp(input)
    .resize(width, height, { fit: "cover", position: "top" })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
  return { bytes, sourceUrl: website.href };
}

async function store(tool: ToolRow, bytes: Buffer, sourceUrl: string, directory: string) {
  const hash = createHash("sha256").update(bytes).digest("hex");
  const key = `tools/${tool.id}/screenshots/${hash}.webp`;
  if (dryRun) return key;
  const filename = path.join(directory, `${tool.slug}.webp`);
  await writeFile(filename, bytes);
  await wrangler([
    "r2", "object", "put", `ordalin-catalog-assets/${key}`, mode,
    "--file", filename,
    "--content-type", "image/webp",
    "--cache-control", "public, max-age=31536000, immutable",
    "--force",
  ]);
  const now = Math.floor(Date.now() / 1000);
  await d1(
    `UPDATE tools SET screenshot_asset_key = ${sql(key)}, updated_at = ${now} WHERE id = ${sql(tool.id)}${includePending ? "" : " AND status = 'published'"}; ` +
      `INSERT INTO moderation_events (id, entity_type, entity_id, action, actor_identity, metadata_json, created_at) VALUES (` +
      `${sql(`event_${randomUUID()}`)}, 'tool', ${sql(tool.id)}, 'website_preview_backfill', 'catalog-preview-backfill', ` +
      `${sql(JSON.stringify({ sourceUrl, assetKey: key, width, height }))}, ${now});`,
  );
  return key;
}

let client: Awaited<ReturnType<typeof serverScreenshotClient>> | undefined;
const tools = await readTools();
const directory = await mkdtemp(path.join(tmpdir(), "ordalin-preview-backfill-"));
const failures: string[] = [];
try {
  if (!screenshotFile && tools.length) client = await serverScreenshotClient();
  for (const [index, tool] of tools.entries()) {
    console.log(`[${index + 1}/${tools.length}] ${tool.name}`);
    try {
      const captured = await capture(tool);
      const key = await store(tool, captured.bytes, captured.sourceUrl, directory);
      console.log(`  ${dryRun ? "would store" : "stored"} ${width}x${height} -> ${key}`);
    } catch (error) {
      failures.push(tool.name);
      console.warn(`  failed: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }
} finally {
  await client?.close();
  await rm(directory, { recursive: true, force: true });
}

console.log(`Screenshot backfill complete: ${tools.length - failures.length}/${tools.length} succeeded.`);
if (failures.length) {
  console.error(`Missing screenshots: ${failures.join(", ")}`);
  process.exitCode = 1;
}
