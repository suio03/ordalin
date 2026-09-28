import { enrichCatalogSite } from "../src/lib/catalog-enrichment/index.ts";

const urls = process.argv.slice(2).filter((argument) => argument !== "--");
if (urls.length < 1 || urls.length > 2) {
  console.error("Usage: pnpm enrich:tool -- https://tool.example [https://second.example]");
  process.exitCode = 1;
} else {
  const candidates = [];
  for (const url of urls) candidates.push(await enrichCatalogSite(url));
  console.log(JSON.stringify(candidates, null, 2));
}
