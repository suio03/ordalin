import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { enrichCatalogSite } from "../src/lib/catalog-enrichment/index.ts";
import { assertPublicHttpsUrl } from "../src/lib/catalog-enrichment/url-policy.ts";
import type { CatalogTaxonomy } from "../src/lib/catalog-analysis/contract.ts";
import type {
  CatalogImportBundle,
  CatalogImportManifest,
  DirectoryProvider,
} from "../src/lib/catalog-import/contract.ts";
import { discoverDetailUrls, resolveOfficialWebsite } from "../src/lib/catalog-import/discovery.ts";
import { catalogRunStamp } from "../src/lib/catalog-import/schedule.ts";
import { databaseMode, d1Query } from "./lib/wrangler.ts";
import { publicFetch } from "./lib/public-fetch.ts";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const mode = databaseMode();
const requestedLimit = Number(process.argv.find((argument) => argument.startsWith("--limit="))?.split("=", 2)[1] ?? 10);
const limit = Math.min(10, Math.max(1, Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 10));
const outputArgument = process.argv.find((argument) => argument.startsWith("--output-dir="))?.split("=", 2)[1];
const outputDirectory = path.resolve(projectRoot, outputArgument ?? `.ordalin-imports/queue/${catalogRunStamp()}`);
const sources: Array<{ provider: DirectoryProvider; listingUrl: string; fallbackUrl?: string }> = [
  { provider: "product_hunt", listingUrl: "https://www.producthunt.com/" },
];
const MAX_HTML_BYTES = 2_000_000;

type CategoryRow = { slug: string; name: string; description: string };
type TagRow = {
  slug: string;
  name: string;
  kind: "category" | "interface" | "attribute";
  group_slug: string | null;
  description: string;
};

async function fetchHtml(input: string) {
  let url = assertPublicHttpsUrl(input);
  for (let redirects = 0; redirects <= 4; redirects += 1) {
    const response = await publicFetch(url.href, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "OrdalinCatalogBot/0.1 (+https://ordalin.com/about/ranking)",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw new Error(`${url.hostname} returned a redirect without a location`);
      url = assertPublicHttpsUrl(new URL(location, url).href);
      continue;
    }
    if (!response.ok) throw new Error(`${url.hostname} returned HTTP ${response.status}`);
    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("text/html")) throw new Error(`${url.hostname} did not return HTML`);
    const declared = Number(response.headers.get("content-length") ?? 0);
    if (declared > MAX_HTML_BYTES) throw new Error(`${url.hostname} returned too much HTML`);
    const html = await response.text();
    if (html.length > MAX_HTML_BYTES) throw new Error(`${url.hostname} returned too much HTML`);
    return html;
  }
  throw new Error(`${url.hostname} redirected too many times`);
}

async function taxonomy(): Promise<CatalogTaxonomy> {
  const categories = await d1Query<CategoryRow>(projectRoot, mode, "SELECT slug, name, description FROM categories WHERE is_active = 1 ORDER BY sort_order, name");
  const tags = await d1Query<TagRow>(projectRoot, mode, "SELECT t.slug, t.name, t.kind, c.slug AS group_slug, t.description FROM tags t LEFT JOIN categories c ON c.id = t.category_group_id WHERE t.is_active = 1 ORDER BY t.kind, t.name");
  if (!categories.length || !tags.length) throw new Error("The catalogue taxonomy is empty; seed the selected database first.");
  return {
    categories,
    tags: tags.map((tag) => ({
      slug: tag.slug,
      name: tag.name,
      kind: tag.kind,
      groupSlug: tag.group_slug,
      description: tag.description,
    })),
  };
}

async function existingDomains() {
  const rows = await d1Query<{ canonical_domain: string }>(
    projectRoot,
    mode,
    "SELECT canonical_domain FROM tools UNION SELECT canonical_domain FROM import_candidates",
  );
  return new Set(rows.map((row) => row.canonical_domain.toLowerCase()));
}

function interleave<T>(groups: T[][]) {
  const results: T[] = [];
  const length = Math.max(0, ...groups.map((group) => group.length));
  for (let index = 0; index < length; index += 1) {
    for (const group of groups) if (group[index]) results.push(group[index]);
  }
  return results;
}

const preparedAt = new Date().toISOString();
const stats = { fetched: 0, duplicates: 0, failed: 0, prepared: 0 };
const existing = await existingDomains();
const detailGroups: Array<Array<{ provider: DirectoryProvider; detailUrl: string }>> = [];
for (const source of sources) {
  try {
    let details: string[] = [];
    let lastError = "no product links were found";
    const listingUrls = [source.listingUrl, source.fallbackUrl].filter((value): value is string => Boolean(value));
    for (const listingUrl of listingUrls) {
      try {
        const html = await fetchHtml(listingUrl);
        details = discoverDetailUrls(source.provider, html, listingUrl).slice(0, 60);
        if (details.length) break;
        lastError = `${listingUrl} contained no product links`;
      } catch (error) {
        lastError = error instanceof Error ? error.message : "direct fetch failed";
      }
    }
    if (!details.length) throw new Error(`No public product links were found (${lastError}); leave this source for HTTP retry. Local-browser fallback is disabled.`);
    console.log(`${source.provider}: found ${details.length} public product pages`);
    detailGroups.push(details.map((detailUrl) => ({ provider: source.provider, detailUrl })));
  } catch (error) {
    stats.failed += 1;
    detailGroups.push([]);
    console.warn(`${source.provider}: ${error instanceof Error ? error.message : "listing fetch failed"}`);
  }
}

await mkdir(outputDirectory, { recursive: true });
const files: string[] = [];
for (const item of interleave(detailGroups)) {
  if (files.length >= limit) break;
  stats.fetched += 1;
  try {
    const detailHtml = await fetchHtml(item.detailUrl);
    const discovered = await resolveOfficialWebsite(item.provider, item.detailUrl, detailHtml, publicFetch);
    if (!discovered) throw new Error("no official website link was found");
    const initialDomain = new URL(discovered.websiteUrl).hostname.toLowerCase().replace(/^www\./, "");
    if (existing.has(initialDomain)) {
      stats.duplicates += 1;
      continue;
    }
    const candidate = await enrichCatalogSite(discovered.websiteUrl, { fetcher: publicFetch, research: true, maxBytesPerPage: 1_000_000 });
    if (existing.has(candidate.canonicalDomain)) {
      stats.duplicates += 1;
      continue;
    }
    existing.add(candidate.canonicalDomain);
    const bundle: CatalogImportBundle = {
      schemaVersion: 1,
      preparedAt,
      ...discovered,
      websiteUrl: candidate.websiteUrl,
      candidate,
      analysis: null,
    };
    const filename = `${item.provider}-${discovered.externalId.replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}.json`;
    await writeFile(path.join(outputDirectory, filename), `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
    files.push(filename);
    stats.prepared += 1;
    console.log(`[${files.length}/${limit}] prepared ${candidate.canonicalDomain}`);
  } catch (error) {
    stats.failed += 1;
    console.warn(`${item.detailUrl}: ${error instanceof Error ? error.message : "preparation failed"}`);
  }
}

const manifest: CatalogImportManifest = {
  schemaVersion: 1,
  preparedAt,
  limit,
  taxonomy: await taxonomy(),
  files,
  discovery: stats,
};
await writeFile(path.join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Prepared ${files.length} unique official websites in ${path.relative(projectRoot, outputDirectory)}.`);
if (!files.length) console.log("Nothing new was found; this is a successful no-op.");
