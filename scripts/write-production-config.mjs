import { existsSync, writeFileSync } from "node:fs";

// Cloudflare Workers Builds checks out a clean tree without the ignored
// wrangler.production.jsonc. The build variable ORDALIN_WRANGLER_CONFIG holds
// that file base64-encoded; maintainer machines keep their local copy.
const target = "wrangler.production.jsonc";
const encoded = process.env.ORDALIN_WRANGLER_CONFIG?.trim();

if (!encoded) {
  if (existsSync(target)) process.exit(0);
  console.error(`Missing ${target}. Set the ORDALIN_WRANGLER_CONFIG build variable to the base64-encoded file.`);
  process.exit(1);
}

const config = Buffer.from(encoded, "base64").toString("utf8");
if (!/"name"\s*:\s*"[^"]+"/.test(config) || !config.includes('"d1_databases"')) {
  console.error("ORDALIN_WRANGLER_CONFIG does not decode to a Wrangler configuration.");
  process.exit(1);
}
writeFileSync(target, config);
console.log(`Wrote ${target} from ORDALIN_WRANGLER_CONFIG.`);
