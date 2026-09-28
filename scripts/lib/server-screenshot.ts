import { getPlatformProxy } from "wrangler";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { assertPublicDns } from "./public-fetch.ts";

/** Only BROWSER is bound; this client cannot access application D1 or R2. */
export async function serverScreenshotClient() {
  const proxy = await getPlatformProxy<Pick<CloudflareEnv, "BROWSER">>({
    configPath: fileURLToPath(new URL("../browser-capture.jsonc", import.meta.url)),
    remoteBindings: true,
    persist: false,
    envFiles: [],
  });
  return {
    close: () => proxy.dispose(),
    async capture(websiteUrl: string) {
      const website = await assertPublicDns(websiteUrl);
      const response = await proxy.env.BROWSER.quickAction("screenshot", {
        url: website.href,
        viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
        gotoOptions: { waitUntil: "networkidle2", timeout: 20_000 },
        waitForTimeout: 1_500,
        screenshotOptions: { type: "png", fullPage: false, captureBeyondViewport: false },
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error(`Cloudflare screenshot returned HTTP ${response.status}. Check Browser binding access for the logged-in Wrangler account.`);
      }
      if (!response.headers.get("content-type")?.startsWith("image/")) {
        await response.body?.cancel();
        throw new Error("Cloudflare screenshot did not return an image.");
      }
      const chunks: Uint8Array[] = [];
      let size = 0;
      const reader = response.body!.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 8_000_000) throw new Error("Cloudflare screenshot exceeds 8 MB.");
          chunks.push(value);
        }
      } finally { await reader.cancel(); }
      const bytes = Buffer.concat(chunks);
      const image = await sharp(bytes).metadata();
      if (image.width !== 1440 || image.height !== 900) throw new Error("Cloudflare screenshot dimensions must be 1440 × 900.");
      return bytes;
    },
  };
}
