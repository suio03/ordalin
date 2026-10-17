import { meta, plainText } from "@/lib/catalog-enrichment/html";
import { sitemapUrl, type FetchedResource } from "@/lib/free-tools/ai-visibility/checks";
import { browserUserAgent } from "@/lib/free-tools/ai-visibility/crawlers";
import { fetchResource } from "@/lib/free-tools/ai-visibility/fetch";
import type { ExcludedPage, LlmsDraft, LlmsPage } from "./format";
import { homepageLinks, parseSitemap, selectPages, titleFromPath, type Candidate, type SitemapEntry } from "./pages";

// Every listed page is fetched for its own title and description.
const PAGE_LIMIT = 30;
// Streamed pages can put <title> after several hundred KB of inline styles.
const PAGE_BYTES = 768_000;
const CONCURRENCY = 6;
const CHILD_SITEMAPS = 3;
// Cloudflare's lowest plan allows 50 subrequests per request; redirects count too.
const SUBREQUEST_BUDGET = 45;

const HTML = "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8";
const XML = "application/xml,text/xml;q=0.9,*/*;q=0.8";

export class SiteUnreachableError extends Error {}

const ok = (resource: FetchedResource) => resource.status !== null && resource.status >= 200 && resource.status < 300;
const SEPARATOR = /\s+[|–—·•:-]\s+/;

function pageTitle(html: string) {
  return plainText(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "") || meta(html, "og:title") || "";
}

/** The product name: og:site_name, else the title part that matches the domain, else the domain. */
export function siteName(html: string | null, hostname: string) {
  const label = hostname.replace(/^www\./, "").split(".")[0];
  if (html) {
    const named = meta(html, "og:site_name") || meta(html, "application-name");
    if (named) return named.trim();
    const parts = pageTitle(html).split(SEPARATOR).map((part) => part.trim()).filter(Boolean);
    const matching = parts.find((part) => part.toLowerCase().replace(/[^a-z0-9]/g, "") === label.toLowerCase().replace(/[^a-z0-9]/g, ""));
    if (matching) return matching;
    if (parts.length > 1) return parts.reduce((shortest, part) => (part.length < shortest.length ? part : shortest));
    if (parts[0] && parts[0].length <= 40) return parts[0];
  }
  return label ? label[0].toUpperCase() + label.slice(1) : hostname;
}

/** Drops the site name from a page title, so "Pricing | Granola" becomes "Pricing". */
export function cleanTitle(title: string, name: string) {
  const parts = title.split(SEPARATOR).map((part) => part.trim()).filter(Boolean);
  const kept = parts.filter((part) => part.toLowerCase() !== name.toLowerCase());
  return (kept.length ? kept.join(" – ") : title).trim();
}

function description(html: string) {
  const value = meta(html, "description") || meta(html, "og:description");
  return value ? value.replace(/\s+/g, " ").trim() || null : null;
}

async function pool<T, R>(items: T[], size: number, run: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const index = next;
        next += 1;
        results[index] = await run(items[index]);
      }
    }),
  );
  return results;
}

/** Sitemap entries, following up to three child sitemaps of an index, page sitemaps before post sitemaps. */
async function sitemapEntries(url: string, fetcher: typeof fetch) {
  const options = { userAgent: browserUserAgent, accept: XML, readBody: true, maxBytes: 3_000_000 };
  const root = await fetchResource(url, fetcher, options);
  if (!ok(root) || !root.body || /^\s*<(?:!doctype|html)/i.test(root.body)) return [];
  const parsed = parseSitemap(root.body);
  if (parsed.kind === "urlset") return parsed.entries;
  const rank = (loc: string) => (/page|main|static|doc|product|feature/i.test(loc) ? 0 : /post|blog|news|tag|categor|author|image|video/i.test(loc) ? 2 : 1);
  const children = parsed.entries
    .filter((entry) => !/\.gz$/i.test(entry.url))
    .sort((left, right) => rank(left.url) - rank(right.url))
    .slice(0, CHILD_SITEMAPS);
  const nested = await Promise.all(children.map((entry) => fetchResource(entry.url, fetcher, options)));
  return nested.flatMap((resource) => (ok(resource) && resource.body ? parseSitemap(resource.body).entries : []));
}

export async function generateLlmsDraft(website: URL, fetcher: typeof fetch = fetch, generatedAt = new Date()): Promise<LlmsDraft> {
  let used = 0;
  // Every hop of fetchResource goes through this, so the budget counts redirects.
  const counted: typeof fetch = (input, init) => {
    used += 1;
    return fetcher(input, init);
  };
  const origin = website.origin;
  const [home, robots] = await Promise.all([
    fetchResource(`${origin}/`, counted, { userAgent: browserUserAgent, accept: HTML, readBody: true, maxBytes: 1_500_000 }),
    fetchResource(`${origin}/robots.txt`, counted, { userAgent: browserUserAgent, accept: "text/plain,*/*;q=0.8", readBody: true, maxBytes: 256_000 }),
  ]);
  const homeHtml = ok(home) && home.body ? home.body : null;
  const robotsText = ok(robots) && robots.body && !/^\s*</.test(robots.body) ? robots.body : null;

  let entries: SitemapEntry[] = await sitemapEntries(sitemapUrl(robots, origin), counted);
  let source: LlmsDraft["source"] = "sitemap";
  if (!entries.length) {
    if (!homeHtml) throw new SiteUnreachableError(`We could not read ${website.hostname}: the homepage and sitemap did not load.`);
    entries = homepageLinks(homeHtml, home.url);
    source = "homepage-links";
  }

  const name = siteName(homeHtml, website.hostname);
  const { candidates, excluded, omitted } = selectPages(entries, website, robotsText, PAGE_LIMIT);
  const extraExcluded: ExcludedPage[] = [];
  const fetched = await pool(candidates, CONCURRENCY, async (candidate) => {
    // Each page may redirect a few times; stop fetching before the platform limit.
    if (used + 3 > SUBREQUEST_BUDGET) return null;
    return fetchResource(candidate.url, counted, { userAgent: browserUserAgent, accept: HTML, readBody: true, maxBytes: PAGE_BYTES });
  });

  const seen = new Set<string>();
  const pages: LlmsPage[] = [];
  candidates.forEach((candidate: Candidate, index) => {
    const resource = fetched[index];
    const fallback = { url: candidate.url, title: titleFromPath(new URL(candidate.url).pathname), description: null, section: candidate.section };
    if (!resource) {
      if (!seen.has(candidate.url)) pages.push(fallback);
      seen.add(candidate.url);
      return;
    }
    if (!ok(resource)) {
      extraExcluded.push({ url: candidate.url, reason: resource.status ? `HTTP ${resource.status}` : resource.error ?? "Did not load" });
      return;
    }
    const finalUrl = new URL(resource.url);
    if (finalUrl.hostname.replace(/^www\./, "") !== website.hostname.replace(/^www\./, "")) {
      extraExcluded.push({ url: candidate.url, reason: "Redirects to another site" });
      return;
    }
    if (finalUrl.pathname === "/") {
      extraExcluded.push({ url: candidate.url, reason: "Redirects to the homepage" });
      return;
    }
    if (resource.contentType && !/html/i.test(resource.contentType)) {
      extraExcluded.push({ url: candidate.url, reason: "Not an HTML page" });
      return;
    }
    const html = resource.body ?? "";
    const robotsMeta = `${meta(html, "robots") ?? ""} ${resource.robotsTag ?? ""}`;
    if (/noindex/i.test(robotsMeta)) {
      extraExcluded.push({ url: candidate.url, reason: "Marked noindex" });
      return;
    }
    if (seen.has(finalUrl.href)) return;
    seen.add(finalUrl.href);
    const title = cleanTitle(pageTitle(html), name) || fallback.title;
    pages.push({ url: finalUrl.href, title, description: description(html), section: candidate.section });
  });

  return {
    website: `${origin}/`,
    domain: website.hostname.replace(/^www\./, ""),
    name,
    summary: homeHtml ? description(homeHtml) : null,
    pages,
    excluded: [...extraExcluded, ...excluded].slice(0, 200),
    omitted,
    source,
    generatedAt: generatedAt.toISOString(),
  };
}
