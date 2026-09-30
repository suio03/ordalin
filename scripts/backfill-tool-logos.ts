import { storageConfigArgs } from "./lib/wrangler.ts";
import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import sharp from "sharp";
import { enrichCatalogSite } from "../src/lib/catalog-enrichment/index.ts";
import { assertPublicHttpsUrl } from "../src/lib/catalog-enrichment/url-policy.ts";
import { publicFetch } from "./lib/public-fetch.ts";
import { logoScore, measureVisibleLogo } from "./lib/logo-choice.ts";

const execute = promisify(execFile);
const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const mode = process.argv.includes("--remote") ? "--remote" : "--local";
const replaceExisting = process.argv.includes("--all");
const dryRun = process.argv.includes("--dry-run");
const includePending = process.argv.includes("--include-pending");
const targetToolId = process.argv.find((argument) => argument.startsWith("--tool-id="))?.slice("--tool-id=".length);
const sourceFileArgument = process.argv.find((argument) => argument.startsWith("--source-file="));
const sourceFileSpec = sourceFileArgument?.slice("--source-file=".length) ?? "";
const sourceFileSeparator = sourceFileSpec.indexOf(":");
const sourceFile = sourceFileSeparator > 0
  ? {
      slug: sourceFileSpec.slice(0, sourceFileSeparator),
      filename: sourceFileSpec.slice(sourceFileSeparator + 1),
    }
  : null;
const MAX_SOURCE_BYTES = 3_000_000;
const STANDARD_PATHS = [
  "/favicon.svg",
  "/apple-touch-icon.png",
  "/favicon.ico",
  "/icon.svg",
  "/icon.png",
  "/logo.svg",
  "/logo.png",
];
const ACCEPTED_TYPES = new Set([
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/vnd.microsoft.icon",
  "image/webp",
  "image/x-icon",
]);

if (process.argv.includes("--local") && process.argv.includes("--remote")) {
  throw new Error("Choose either --local or --remote, not both.");
}

type ToolRow = {
  id: string;
  slug: string;
  name: string;
  website_url: string;
  logo_asset_key: string | null;
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
  const output = await wrangler([
    "d1",
    "execute",
    "DB",
    mode,
    "--json",
    "--command",
    command,
  ]);
  return JSON.parse(output) as Array<{ results?: unknown[] }>;
}

async function readTools() {
  const condition = replaceExisting ? "" : "AND logo_asset_key IS NULL";
  const status = includePending ? "status IN ('published', 'pending_review')" : "status = 'published'";
  const target = targetToolId ? `AND id = ${sql(targetToolId)}` : "";
  const result = await d1(
    `SELECT id, slug, name, website_url, logo_asset_key FROM tools WHERE ${status} ${condition} ${target} ORDER BY name`,
  );
  return (result[0]?.results ?? []) as ToolRow[];
}

async function boundedBytes(response: Response) {
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > MAX_SOURCE_BYTES) throw new Error("image is too large");
  if (!response.body) return new Uint8Array(await response.arrayBuffer());
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_SOURCE_BYTES) {
      await reader.cancel();
      throw new Error("image is too large");
    }
    chunks.push(value);
  }
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

async function fetchLogo(input: string) {
  let url = assertPublicHttpsUrl(input);
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const response = await publicFetch(url.href, {
      headers: {
        accept: "image/avif,image/webp,image/svg+xml,image/png,image/*;q=0.8",
        "user-agent": "OrdalinCatalogBot/0.1 (+https://ordalin.com/about/ranking)",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("redirect has no location");
      url = assertPublicHttpsUrl(new URL(location, url).href);
      continue;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const type = (response.headers.get("content-type") ?? "").split(";", 1)[0].toLowerCase();
    if (!ACCEPTED_TYPES.has(type)) throw new Error(`unsupported content type ${type || "unknown"}`);
    const bytes = await boundedBytes(response);
    if (type === "image/svg+xml") {
      const svg = new TextDecoder().decode(bytes);
      if (!/<svg\b/i.test(svg) || /<script\b|<foreignObject\b|\son\w+\s*=|(?:href|src)\s*=\s*["'](?:https?:|\/\/)/i.test(svg)) {
        throw new Error("unsafe SVG");
      }
    }
    return { bytes, sourceUrl: url.href };
  }
  throw new Error("too many redirects");
}

async function webpLogo(input: Uint8Array) {
  const source = sharp(input, { density: 256, limitInputPixels: 25_000_000, animated: false }).rotate();
  // Drop transparent padding so the mark fills the tile; opaque tiles keep their background.
  const { hasAlpha } = await source.metadata();
  const trimmed = hasAlpha ? sharp(await source.trim({ threshold: 0 }).toBuffer()) : source;
  return trimmed
    .resize(448, 448, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: 32,
      bottom: 32,
      left: 32,
      right: 32,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 90, alphaQuality: 100 })
    .toBuffer();
}

async function candidates(tool: ToolRow) {
  const values: string[] = [];
  try {
    const candidate = await enrichCatalogSite(tool.website_url, { maxPages: 1, fetcher: publicFetch });
    values.push(
      ...candidate.assets
        .filter((asset) => asset.kind === "logo" || asset.kind === "icon")
        .map((asset) => asset.value),
    );
  } catch (error) {
    console.warn(`  website enrichment failed: ${error instanceof Error ? error.message : "unknown error"}`);
  }
  const origin = new URL(tool.website_url).origin;
  values.push(...STANDARD_PATHS.map((pathname) => new URL(pathname, origin).href));
  return [...new Set(values)];
}

async function storeLogo(tool: ToolRow, bytes: Buffer, sourceUrl: string, directory: string) {
  const hash = createHash("sha256").update(bytes).digest("hex");
  const key = `tools/${tool.id}/logo/${hash}.webp`;
  if (dryRun) return key;
  const filename = path.join(directory, `${tool.slug}.webp`);
  await writeFile(filename, bytes);
  await wrangler([
    "r2",
    "object",
    "put",
    `ordalin-catalog-assets/${key}`,
    mode,
    "--file",
    filename,
    "--content-type",
    "image/webp",
    "--cache-control",
    "public, max-age=31536000, immutable",
    "--force",
  ]);
  const now = Math.floor(Date.now() / 1000);
  await d1(
    `UPDATE tools SET logo_asset_key = ${sql(key)}, updated_at = ${now} WHERE id = ${sql(tool.id)}${includePending ? "" : " AND status = 'published'"}; ` +
      `INSERT INTO moderation_events (id, entity_type, entity_id, action, actor_identity, metadata_json, created_at) VALUES (` +
      `${sql(`event_${randomUUID()}`)}, 'tool', ${sql(tool.id)}, 'logo_backfill', 'catalog-logo-backfill', ` +
      `${sql(JSON.stringify({ sourceUrl, assetKey: key }))}, ${now});`,
  );
  return key;
}

const tools = await readTools();
const directory = await mkdtemp(path.join(tmpdir(), "ordalin-logo-backfill-"));
const failures: string[] = [];
try {
  for (const [index, tool] of tools.entries()) {
    console.log(`[${index + 1}/${tools.length}] ${tool.name}`);
    let stored = false;
    if (sourceFile?.slug === tool.slug) {
      try {
        const converted = await webpLogo(await readFile(sourceFile.filename));
        const sourceUrl = new URL("/logo.png", tool.website_url).href;
        const key = await storeLogo(tool, converted, sourceUrl, directory);
        console.log(`  ${dryRun ? "would use" : "stored"} ${sourceUrl} from ${sourceFile.filename} -> ${key}`);
        stored = true;
      } catch (error) {
        console.warn(`  source file failed: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    }
    if (stored) continue;
    // Compare every usable candidate so a square icon wins over a wide wordmark.
    let best: { bytes: Uint8Array; sourceUrl: string; score: number } | null = null;
    for (const candidate of await candidates(tool)) {
      try {
        const fetched = await fetchLogo(candidate);
        const score = logoScore(await measureVisibleLogo(fetched.bytes));
        if (!best || score > best.score) best = { ...fetched, score };
      } catch (error) {
        console.warn(`  skipped ${candidate}: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    }
    if (best) {
      try {
        const converted = await webpLogo(best.bytes);
        const key = await storeLogo(tool, converted, best.sourceUrl, directory);
        console.log(`  ${dryRun ? "would use" : "stored"} ${best.sourceUrl} (score ${best.score.toFixed(2)}) -> ${key}`);
        stored = true;
      } catch (error) {
        console.warn(`  failed ${best.sourceUrl}: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    }
    if (!stored) failures.push(tool.name);
  }
} finally {
  await rm(directory, { recursive: true, force: true });
}

console.log(`Logo backfill complete: ${tools.length - failures.length}/${tools.length} succeeded.`);
if (failures.length) {
  console.error(`Missing logos: ${failures.join(", ")}`);
  process.exitCode = 1;
}
