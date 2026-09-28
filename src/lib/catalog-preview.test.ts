import sharp from "sharp";
import { vi } from "vitest";
import {
  captureAndStoreWebsitePreview,
  WEBSITE_PREVIEW_HEIGHT,
  WEBSITE_PREVIEW_WIDTH,
} from "./catalog-preview";

async function previewBytes(width = WEBSITE_PREVIEW_WIDTH, height = WEBSITE_PREVIEW_HEIGHT) {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 18, g: 29, b: 25 },
    },
  }).webp({ quality: 82 }).toBuffer();
}

function previewEnvironment(bytes: Uint8Array) {
  const quickAction = vi.fn(async () => new Response(Uint8Array.from(bytes).buffer, { headers: { "content-type": "image/webp" } }));
  const put = vi.fn(async () => undefined);
  const prepare = vi.fn((sql: string) => ({
    bind: (...bindings: unknown[]) => ({ sql, bindings }),
  }));
  const batch = vi.fn(async () => []);
  const env = {
    BROWSER: { quickAction },
    CATALOG_ASSETS: { put },
    DB: { prepare, batch },
  } as unknown as Parameters<typeof captureAndStoreWebsitePreview>[0];
  return { env, quickAction, put, batch };
}

describe("website preview capture", () => {
  it("captures one fixed viewport and stores an immutable WebP", async () => {
    const runtime = previewEnvironment(await previewBytes());
    const key = await captureAndStoreWebsitePreview(runtime.env, {
      id: "tool_example",
      websiteUrl: "https://example.com/",
    });

    expect(runtime.quickAction).toHaveBeenCalledWith("screenshot", expect.objectContaining({
      url: "https://example.com/",
      viewport: expect.objectContaining({ width: 1440, height: 900, deviceScaleFactor: 1 }),
      screenshotOptions: expect.objectContaining({ type: "webp", quality: 82, fullPage: false }),
    }));
    expect(key).toMatch(/^tools\/tool_example\/screenshots\/[a-f0-9]{64}\.webp$/);
    expect(runtime.put).toHaveBeenCalledWith(
      key,
      expect.any(Uint8Array),
      expect.objectContaining({ customMetadata: expect.objectContaining({ width: "1440", height: "900" }) }),
    );
    expect(runtime.batch).toHaveBeenCalledOnce();
  });

  it("rejects an image that does not match the fixed viewport", async () => {
    const runtime = previewEnvironment(await previewBytes(1200, 800));
    await expect(captureAndStoreWebsitePreview(runtime.env, {
      id: "tool_example",
      websiteUrl: "https://example.com/",
    })).rejects.toThrow("unexpected dimensions");
    expect(runtime.put).not.toHaveBeenCalled();
  });
});
