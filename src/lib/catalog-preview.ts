import { assertPublicHttpsUrl } from "@/lib/catalog-enrichment/url-policy";
import { webpDimensions } from "@/lib/submissions/image";

export const WEBSITE_PREVIEW_WIDTH = 1440;
export const WEBSITE_PREVIEW_HEIGHT = 900;

type PreviewEnvironment = Pick<CloudflareEnv, "BROWSER" | "CATALOG_ASSETS" | "DB">;

async function boundedImage(response: Response) {
  if (!response.ok) throw new Error(`Browser Run returned HTTP ${response.status}`);
  const contentType = (response.headers.get("content-type") ?? "").split(";", 1)[0].toLowerCase();
  if (contentType !== "image/webp") throw new Error(`Browser Run returned ${contentType || "an unknown content type"}`);
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > 4_000_000) throw new Error("Website preview is larger than 4 MB");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > 4_000_000) throw new Error("Website preview is larger than 4 MB");
  return bytes;
}

async function sha256(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes).buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function captureWebsitePreview(env: Pick<CloudflareEnv, "BROWSER">, websiteUrl: string) {
  const website = assertPublicHttpsUrl(websiteUrl);
  const response = await env.BROWSER.quickAction("screenshot", {
    url: website.href,
    viewport: {
      width: WEBSITE_PREVIEW_WIDTH,
      height: WEBSITE_PREVIEW_HEIGHT,
      deviceScaleFactor: 1,
    },
    gotoOptions: {
      waitUntil: "networkidle2",
      timeout: 20_000,
    },
    waitForTimeout: 1_500,
    screenshotOptions: {
      type: "webp",
      quality: 82,
      fullPage: false,
      captureBeyondViewport: false,
      optimizeForSpeed: true,
    },
  });
  const bytes = await boundedImage(response);
  const dimensions = webpDimensions(bytes);
  if (!dimensions || dimensions.width !== WEBSITE_PREVIEW_WIDTH || dimensions.height !== WEBSITE_PREVIEW_HEIGHT) {
    throw new Error("Browser Run returned a website preview with unexpected dimensions");
  }

  const capturedAt = Math.floor(Date.now() / 1000);
  const hash = await sha256(bytes);
  return { bytes, hash, ...dimensions, capturedAt, websiteUrl: website.href };
}

export async function captureAndStoreWebsitePreview(env: PreviewEnvironment, tool: { id: string; websiteUrl: string }) {
  const { bytes, hash, width, height, capturedAt, websiteUrl } = await captureWebsitePreview(env, tool.websiteUrl);
  const dimensions = { width, height };
  const key = `tools/${tool.id}/screenshots/${hash}.webp`;
  await env.CATALOG_ASSETS.put(key, bytes, {
    httpMetadata: {
      contentType: "image/webp",
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      width: String(dimensions.width),
      height: String(dimensions.height),
      source: "website-preview",
      sourceUrl: websiteUrl,
      capturedAt: String(capturedAt),
    },
  });
  await env.DB.batch([
    env.DB
      .prepare("UPDATE tools SET screenshot_asset_key = ?, updated_at = ? WHERE id = ? AND status = 'published'")
      .bind(key, capturedAt, tool.id),
    env.DB
      .prepare("INSERT INTO moderation_events (id, entity_type, entity_id, action, actor_identity, metadata_json, created_at) VALUES (?, 'tool', ?, 'website_preview_capture', 'browser-run', ?, ?)")
      .bind(
        `event_${crypto.randomUUID()}`,
        tool.id,
        JSON.stringify({ assetKey: key, sourceUrl: websiteUrl, width: dimensions.width, height: dimensions.height }),
        capturedAt,
      ),
  ]);
  return key;
}
