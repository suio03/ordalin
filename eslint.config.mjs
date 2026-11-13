import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    ".open-next/**",
    ".wrangler/**",
    ".ordalin-imports/**",
    // Test fixtures are deliberately messy code that agent skills are asked to fix.
    "scripts/agent-test/fixtures/**",
    "coverage/**",
    "cloudflare-env.d.ts",
    "next-env.d.ts",
  ]),
]);
