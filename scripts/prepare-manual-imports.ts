import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { enrichCatalogSite } from "../src/lib/catalog-enrichment/index.ts";
import { assertPublicHttpsUrl } from "../src/lib/catalog-enrichment/url-policy.ts";
import type { CatalogTaxonomy } from "../src/lib/catalog-analysis/contract.ts";
import type { CatalogImportBundle, CatalogImportManifest } from "../src/lib/catalog-import/contract.ts";
import { catalogRunStamp } from "../src/lib/catalog-import/schedule.ts";
import { databaseMode, d1Query } from "./lib/wrangler.ts";
import { publicFetch } from "./lib/public-fetch.ts";
import { renderedFetchClient } from "./lib/rendered-fetch.ts";

// Operator-selected official websites, prepared into the same bundle format as
// directory discovery so analysis, screenshots and apply are unchanged.
const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const mode = databaseMode();
const argument = (name: string) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split("=", 2)[1];
const listFile = argument("file");
const inline = argument("urls")?.split(",") ?? [];
const fromFile = listFile ? (await readFile(path.resolve(listFile), "utf8")).split("\n") : [];
const urls = [...inline, ...fromFile].map((line) => line.replace(/#.*/, "").trim()).filter(Boolean);
if (!urls.length) throw new Error("Provide --urls=https://a.example,https://b.example or --file=<one URL per line>.");
if (urls.length > 10) throw new Error("Prepare at most 10 official websites per manifest.");
// --render: replace JavaScript-shell pages with Cloudflare server-side renders.
const renderer = process.argv.includes("--render") ? await renderedFetchClient() : null;
const outputDirectory = path.resolve(projectRoot, argument("output-dir") ?? `.ordalin-imports/queue/${catalogRunStamp()}-manual`);

type CategoryRow = { slug: string; name: string; description: string };
type TagRow = { slug: string; name: string; kind: "category" | "interface" | "attribute"; group_slug: string | null; description: string };

async function taxonomy(): Promise<CatalogTaxonomy> {
  const categories = await d1Query<CategoryRow>(projectRoot, mode, "SELECT slug, name, description FROM categories WHERE is_active = 1 ORDER BY sort_order, name");
  const tags = await d1Query<TagRow>(projectRoot, mode, "SELECT t.slug, t.name, t.kind, c.slug AS group_slug, t.description FROM tags t LEFT JOIN categories c ON c.id = t.category_group_id WHERE t.is_active = 1 ORDER BY t.kind, t.name");
  if (!categories.length || !tags.length) throw new Error("The catalogue taxonomy is empty; seed the selected database first.");
  return {
    categories,
    tags: tags.map((tag) => ({ slug: tag.slug, name: tag.name, kind: tag.kind, groupSlug: tag.group_slug, description: tag.description })),
  };
}

const existing = new Set(
  (await d1Query<{ canonical_domain: string }>(projectRoot, mode, "SELECT canonical_domain FROM tools UNION SELECT canonical_domain FROM import_candidates"))
    .map((row) => row.canonical_domain.toLowerCase()),
);
const preparedAt = new Date().toISOString();
const stats = { fetched: 0, duplicates: 0, failed: 0, prepared: 0 };
const files: string[] = [];
await mkdir(outputDirectory, { recursive: true });

for (const input of urls) {
  stats.fetched += 1;
  try {
    const url = assertPublicHttpsUrl(input);
    if (existing.has(url.hostname.toLowerCase().replace(/^www\./, ""))) {
      stats.duplicates += 1;
      console.log(`${url.hostname}: already in the catalogue or import history`);
      continue;
    }
    const candidate = await enrichCatalogSite(url.href, { fetcher: renderer?.fetcher ?? publicFetch, research: true, maxBytesPerPage: 1_000_000 });
    if (existing.has(candidate.canonicalDomain)) {
      stats.duplicates += 1;
      console.log(`${candidate.canonicalDomain}: already in the catalogue or import history`);
      continue;
    }
    existing.add(candidate.canonicalDomain);
    const bundle: CatalogImportBundle = {
      schemaVersion: 1,
      preparedAt,
      provider: "manual",
      externalId: `url:${candidate.canonicalDomain}`,
      discoveryUrl: candidate.websiteUrl,
      websiteUrl: candidate.websiteUrl,
      candidate,
      analysis: null,
    };
    const filename = `manual-${candidate.canonicalDomain.replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}.json`;
    await writeFile(path.join(outputDirectory, filename), `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
    files.push(filename);
    stats.prepared += 1;
    console.log(`[${files.length}/${urls.length}] prepared ${candidate.canonicalDomain} (${candidate.evidencePages.length} evidence pages)`);
  } catch (error) {
    stats.failed += 1;
    console.warn(`${input}: ${error instanceof Error ? error.message : "preparation failed"}`);
  }
}

await renderer?.close();
if (renderer) console.log(`Rendered ${renderer.renderedPages()} JavaScript-shell pages through Cloudflare Browser Rendering.`);
const manifest: CatalogImportManifest = { schemaVersion: 1, preparedAt, limit: urls.length, taxonomy: await taxonomy(), files, discovery: stats };
await writeFile(path.join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Prepared ${files.length} official websites in ${path.relative(projectRoot, outputDirectory)}.`);
