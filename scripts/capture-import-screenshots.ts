import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CatalogImportBundle, CatalogImportManifest } from "../src/lib/catalog-import/contract.ts";
import { reviewedImportScreenshot } from "./lib/import-screenshot.ts";
import { serverScreenshotClient } from "./lib/server-screenshot.ts";

const manifestArgument = process.argv.find(arg => arg.startsWith("--manifest="))?.slice("--manifest=".length);
if (!manifestArgument) throw new Error("Provide --manifest=<manifest.json>. Captures use Cloudflare, never local Chrome.");
const manifestPath = path.resolve(manifestArgument);
const manifest: CatalogImportManifest = JSON.parse(await readFile(manifestPath, "utf8"));
const directory = path.join(path.dirname(manifestPath), "screenshots");
await mkdir(directory, { recursive: true });
let client: Awaited<ReturnType<typeof serverScreenshotClient>> | undefined;
let failed = 0;
try {
  for (const filename of manifest.files) {
    if (path.basename(filename) !== filename) throw new Error("Invalid manifest filename.");
    const bundle: CatalogImportBundle = JSON.parse(await readFile(path.join(path.dirname(manifestPath), filename), "utf8"));
    // Spend browser time only on candidates whose research has been prepared.
    if (!bundle.analysis?.isAiTool || !bundle.analysis.profile) continue;
    const domain = bundle.candidate.canonicalDomain;
    if (!/^[a-z0-9.-]+$/i.test(domain)) throw new Error("Invalid screenshot domain.");
    try {
      try {
        await reviewedImportScreenshot(directory, domain, bundle.websiteUrl);
        console.log(`${domain}: reused screenshot`);
        continue;
      } catch { /* Missing or stale captures are retryable. */ }
      client ??= await serverScreenshotClient();
      const bytes = await client.capture(bundle.websiteUrl);
      await writeFile(path.join(directory, `${domain}.png`), bytes);
      await writeFile(path.join(directory, `${domain}.json`), JSON.stringify({
        sourceUrl: bundle.websiteUrl, provider: "cloudflare-browser-rendering",
        capturedAt: new Date().toISOString(), viewport: { width: 1440, height: 900 },
      }, null, 2) + "\n");
      console.log(`${domain}: captured one server screenshot`);
    } catch (error) {
      failed += 1;
      console.error(`${domain}: ${error instanceof Error ? error.message : "capture failed"}; left local for retry`);
      if (!client) break; // An account/setup failure affects the entire batch.
    }
  }
} finally { await client?.close(); }
if (failed) process.exitCode = 1;
