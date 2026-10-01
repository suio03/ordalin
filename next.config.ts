import { existsSync } from "node:fs";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Resolve metadata (including pagination bounds) before sending HTTP headers.
  htmlLimitedBots: /.*/,
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
};

const withMDX = createMDX();

// Maintainers keep their existing read-only production preview. Fresh clones
// use isolated local fixtures; dev:demo explicitly selects them on any machine.
const useProductionPreview = process.env.NODE_ENV === "development"
  && process.env.ORDALIN_DEMO !== "1"
  && existsSync("wrangler.production.jsonc");
const devContextReady = initOpenNextCloudflareForDev({
  configPath: useProductionPreview ? "wrangler.production.jsonc" : "wrangler.jsonc",
  ...(useProductionPreview ? {} : { persist: { path: ".wrangler/demo/v3" } }),
});

// Wait for the context before serving: until it exists, OpenNext falls back to
// the default wrangler.jsonc and an empty local D1, so the first request fails
// while the remote production connection is still starting.
export default async function config(): Promise<NextConfig> {
  await devContextReady;
  return withMDX(nextConfig);
}
