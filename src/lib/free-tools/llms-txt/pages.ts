import { attr } from "@/lib/catalog-enrichment/html";
import { parseRobots, robotsVerdict } from "@/lib/free-tools/ai-visibility/robots";
import type { ExcludedPage, Section } from "./format";

export type SitemapEntry = { url: string; lastmod: string | null };
export type ParsedSitemap = { kind: "index" | "urlset"; entries: SitemapEntry[] };

const MAX_ENTRIES = 5_000;

function xmlText(value: string) {
  return value
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1")
    .replaceAll("&amp;", "&")
    .replaceAll("&apos;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .trim();
}

export function parseSitemap(xml: string): ParsedSitemap {
  const kind = /<sitemapindex[\s>]/i.test(xml) ? "index" : "urlset";
  const entries: SitemapEntry[] = [];
  for (const match of xml.matchAll(/<(?:url|sitemap)\b[^>]*>([\s\S]*?)<\/(?:url|sitemap)>/gi)) {
    const loc = /<loc>([\s\S]*?)<\/loc>/i.exec(match[1])?.[1];
    if (!loc) continue;
    const lastmod = /<lastmod>([\s\S]*?)<\/lastmod>/i.exec(match[1])?.[1];
    entries.push({ url: xmlText(loc), lastmod: lastmod ? xmlText(lastmod) : null });
    if (entries.length >= MAX_ENTRIES) break;
  }
  return { kind, entries };
}

/** Same-site links from the homepage, used when a site has no sitemap. */
export function homepageLinks(html: string, pageUrl: string): SitemapEntry[] {
  const links: SitemapEntry[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
    const href = attr(match[0], "href");
    if (!href || href.startsWith("#") || /^(?:mailto|tel|javascript):/i.test(href)) continue;
    try {
      const url = new URL(href, pageUrl);
      url.hash = "";
      if (!seen.has(url.href)) {
        seen.add(url.href);
        links.push({ url: url.href, lastmod: null });
      }
    } catch {
      // Ignore malformed links.
    }
  }
  return links;
}

const LANGUAGES = new Set(
  "ar bg cs da de el es et fa fi fr he hi hr hu id it ja ko lt lv ms nb nl no pl pt ro ru sk sl sr sv th tr uk vi zh".split(" "),
);

const excludeRules: Array<[RegExp, string]> = [
  [/\.(?:xml|rss|atom|json|txt|pdf|zip|csv|jpe?g|png|gif|webp|svg|mp4|mp3)$/i, "File, not a page"],
  [/(?:^|\/)(?:feed|rss)(?:\/|$)/i, "Feed"],
  [/(?:^|\/)(?:log-?in|sign-?in|sign-?up|register|logout|sign-?out|account|my-account|dashboard|reset-password|forgot-password|auth|oauth|sso)(?:\/|$)/i, "Sign-in or account page"],
  [/(?:^|\/)(?:cart|basket|checkout|order-received)(?:\/|$)/i, "Cart or checkout page"],
  [/(?:^|\/)search(?:\/|$)/i, "Search results"],
  [/(?:^|\/)page\/\d+(?:\/|$)/i, "Pagination"],
  [/(?:^|\/)(?:tags?|authors?|archives?)(?:\/|$)/i, "Archive listing"],
  // Category pages are archives on a blog but often core pages elsewhere, such as a directory.
  [/(?:^|\/)(?:blog|news|posts?|articles?)\/(?:category|categories)(?:\/|$)/i, "Archive listing"],
  [/(?:^|\/)(?:wp-admin|wp-content|wp-json|cdn-cgi|_next|static|assets)(?:\/|$)/i, "Site internals"],
  [/(?:^|\/)(?:thank-?you|confirm|unsubscribe|404|500)(?:\/|$)/i, "Utility page"],
];

const sectionRules: Array<[RegExp, Section]> = [
  [/^\/(?:privacy|terms|tos|legal|cookies?|gdpr|dpa|imprint|impressum|acceptable-use|subprocessors|disclaimer)/i, "Optional"],
  [/^\/(?:docs?|documentation|guides?|api|reference|help|support|kb|knowledge-base|learn|tutorials?|developers?|faq|getting-started)(?:[/.-]|$)/i, "Docs"],
  [/^\/(?:features?|products?|pricing|plans|integrations?|apps|download|enterprise|security|changelog|releases|whats-new|templates|platform|how-it-works|compare|vs)(?:[/.-]|$)/i, "Product"],
  [/^\/(?:use-?cases?|solutions?|for|customers?|case-studies|stories|industries|teams|roles|examples|showcase)(?:[/.-]|$)/i, "Use cases"],
  [/^\/(?:blog|posts?|articles?|news|resources|insights|updates|journal|research)(?:[/.-]|$)/i, "Blog"],
  [/^\/(?:about|about-us|company|team|contact|contact-us|careers|jobs|press|media|brand|partners?|affiliates?|investors)(?:[/.-]|$)/i, "Company"],
];

export function sectionFor(pathname: string): Section {
  for (const [pattern, section] of sectionRules) if (pattern.test(pathname)) return section;
  // Unrecognised top-level pages are usually product pages; deeper ones are details.
  return pathname.split("/").filter(Boolean).length <= 1 ? "Pages" : "Optional";
}

export type Candidate = { url: string; section: Section; depth: number; lastmod: string | null; order: number };

export type Selection = { candidates: Candidate[]; excluded: ExcludedPage[]; omitted: number };

const sectionPriority: Record<Section, number> = { Docs: 0, Product: 1, "Use cases": 2, Pages: 3, Company: 4, Blog: 5, Optional: 6 };
const sectionLimit: Record<Section, number> = { Docs: 12, Product: 10, "Use cases": 6, Pages: 10, Company: 5, Blog: 6, Optional: 8 };
// Child pages per parent path, so twenty integration pages cannot crowd out the rest of the site.
const childLimit = (section: Section) => (section === "Docs" ? 8 : section === "Blog" ? sectionLimit.Blog : 3);

/**
 * Turns discovered URLs into a short, ordered list for llms.txt: same-site
 * pages only, without account, archive or translated copies, allowed for
 * every crawler by robots.txt. Top-level pages are taken first, then child
 * pages in sitemap order, newest posts first, capped per section and parent.
 */
export function selectPages(entries: SitemapEntry[], website: URL, robots: string | null, limit: number): Selection {
  const parsed = robots ? parseRobots(robots) : null;
  const host = website.hostname.replace(/^www\./, "");
  const excluded: ExcludedPage[] = [];
  const seen = new Set<string>();
  const found: Candidate[] = [];

  for (const entry of entries) {
    let url: URL;
    try {
      url = new URL(entry.url);
    } catch {
      continue;
    }
    url.hash = "";
    const key = `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/$/, "")}${url.search}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const exclude = (reason: string) => excluded.push({ url: url.href, reason });

    if (url.hostname.replace(/^www\./, "") !== host) { exclude("Different site"); continue; }
    if (url.protocol !== "https:") { exclude("Not HTTPS"); continue; }
    if (url.pathname === "/" || url.pathname === "") continue;
    if (url.search) { exclude("Has query parameters"); continue; }
    const first = url.pathname.split("/")[1]?.toLowerCase() ?? "";
    if (LANGUAGES.has(first.split(/[-_]/)[0]) && /^[a-z]{2}(?:[-_][a-z]{2,4})?$/.test(first)) { exclude("Translated copy"); continue; }
    const rule = excludeRules.find(([pattern]) => pattern.test(url.pathname));
    if (rule) { exclude(rule[1]); continue; }
    if (parsed && !robotsVerdict(parsed, "*", url.pathname).allowed) { exclude("Blocked by robots.txt"); continue; }

    found.push({
      url: url.href,
      section: sectionFor(url.pathname),
      depth: url.pathname.split("/").filter(Boolean).length,
      lastmod: entry.lastmod,
      order: found.length,
    });
  }

  const ordered = found.sort((left, right) => {
    if (left.depth !== right.depth) return left.depth - right.depth;
    if (left.section === "Blog" && right.section === "Blog") return (right.lastmod ?? "").localeCompare(left.lastmod ?? "") || left.order - right.order;
    return sectionPriority[left.section] - sectionPriority[right.section] || left.order - right.order;
  });
  const perSection = new Map<Section, number>();
  const perParent = new Map<string, number>();
  const candidates: Candidate[] = [];
  let omitted = 0;
  for (const candidate of ordered) {
    const parent = new URL(candidate.url).pathname.split("/").filter(Boolean).slice(0, -1).join("/");
    const inSection = perSection.get(candidate.section) ?? 0;
    const siblings = parent ? perParent.get(parent) ?? 0 : 0;
    if (candidates.length >= limit || inSection >= sectionLimit[candidate.section] || (parent && siblings >= childLimit(candidate.section))) {
      omitted += 1;
      continue;
    }
    perSection.set(candidate.section, inSection + 1);
    if (parent) perParent.set(parent, siblings + 1);
    candidates.push(candidate);
  }
  // Listed by section, in the order chosen above.
  candidates.sort((left, right) => sectionPriority[left.section] - sectionPriority[right.section]);
  return { candidates, excluded, omitted };
}

/** A readable title from a URL slug, for pages we did not fetch. */
export function titleFromPath(pathname: string) {
  const last = pathname.split("/").filter(Boolean).at(-1) ?? "";
  let slug = last;
  try {
    slug = decodeURIComponent(last);
  } catch {
    // Keep the raw segment when it is not valid percent-encoding.
  }
  slug = slug.replace(/\.[a-z0-9]+$/i, "");
  const words = slug.replace(/[-_]+/g, " ").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : pathname;
}
