import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { reviewedImportScreenshot } from "./import-screenshot";

describe("reviewed import screenshot", () => {
  let directory: string;
  const sourceUrl = "https://example.com/";
  beforeEach(async () => { directory = await mkdtemp(path.join(tmpdir(), "ordalin-screenshot-test-")); });
  afterEach(async () => { await rm(directory, { recursive: true, force: true }); });
  async function fixture(overrides = {}) {
    await sharp({ create: { width: 1440, height: 900, channels: 3, background: "white" } }).png().toFile(path.join(directory, "example.com.png"));
    await writeFile(path.join(directory, "example.com.json"), JSON.stringify({ sourceUrl, browserProfile: "ai-publisher", capturedAt: new Date().toISOString(), viewport: { width: 1440, height: 900 }, ...overrides }));
  }
  it("accepts a recent ai-publisher capture for the exact URL", async () => {
    await fixture();
    await expect(reviewedImportScreenshot(directory, "example.com", sourceUrl)).resolves.toBe(path.join(directory, "example.com.png"));
  });
  it("accepts server captures and rejects corrupt or wrong-size images", async () => {
    await fixture({ browserProfile: undefined, provider: "cloudflare-browser-rendering" });
    await expect(reviewedImportScreenshot(directory, "example.com", sourceUrl)).resolves.toBeTruthy();
    await sharp({ create: { width: 800, height: 600, channels: 3, background: "white" } }).png().toFile(path.join(directory, "example.com.png"));
    await expect(reviewedImportScreenshot(directory, "example.com", sourceUrl)).rejects.toThrow("dimensions");
    await writeFile(path.join(directory, "example.com.png"), "not an image");
    await expect(reviewedImportScreenshot(directory, "example.com", sourceUrl)).rejects.toThrow();
  });
  it("rejects another profile, URL, viewport, or stale capture", async () => {
    for (const override of [{ browserProfile: "temporary" }, { sourceUrl: "https://other.example/" }, { viewport: { width: 800, height: 600 } }, { capturedAt: "2020-01-01T00:00:00Z" }]) {
      await fixture(override);
      await expect(reviewedImportScreenshot(directory, "example.com", sourceUrl)).rejects.toThrow();
    }
  });
  it("rejects missing image files before publication", async () => {
    await fixture();
    await rm(path.join(directory, "example.com.png"));
    await expect(reviewedImportScreenshot(directory, "example.com", sourceUrl)).rejects.toThrow();
  });
});
