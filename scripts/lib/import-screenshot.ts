import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export async function reviewedImportScreenshot(directory: string, domain: string, websiteUrl: string) {
  if (!/^[a-z0-9.-]+$/i.test(domain)) throw new Error("Invalid screenshot domain.");
  const filename = path.join(directory, `${domain}.png`);
  const metadata = JSON.parse(await readFile(path.join(directory, `${domain}.json`), "utf8"));
  if ((metadata.provider !== "cloudflare-browser-rendering" && metadata.browserProfile !== "ai-publisher") || metadata.sourceUrl !== websiteUrl || metadata.viewport?.width !== 1440 || metadata.viewport?.height !== 900) {
    throw new Error("Import screenshot must have trusted capture provenance at 1440 × 900 for this exact official URL.");
  }
  const capturedAt = Date.parse(metadata.capturedAt);
  if (!Number.isFinite(capturedAt) || capturedAt > Date.now() + 60_000 || Date.now() - capturedAt > 86_400_000) throw new Error("Import screenshot must have been captured within the last 24 hours.");
  const info = await stat(filename);
  if (!info.isFile() || info.size === 0 || info.size > 8_000_000) throw new Error("Import screenshot is missing or exceeds 8 MB.");
  const image = await sharp(filename).metadata();
  if (image.width !== 1440 || image.height !== 900) throw new Error("Import screenshot image dimensions must be 1440 × 900.");
  return filename;
}
