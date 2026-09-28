import { assertPublicHttpsUrl } from "../catalog-enrichment/url-policy.ts";
import { cleanCatalogWebsiteUrl } from "../catalog-links.ts";
import type { DirectoryProvider, DiscoveredCatalogUrl } from "./contract";

const SOURCE_HOSTS: Record<DirectoryProvider, string> = {
  product_hunt: "www.producthunt.com",
  toolify: "www.toolify.ai",
};

const BLOCKED_DESTINATIONS = [
  "apps.apple.com",
  "chromewebstore.google.com",
  "facebook.com",
  "github.com",
  "instagram.com",
  "linkedin.com",
  "pinterest.com",
  "play.google.com",
  "reddit.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "youtube.com",
];

type HtmlLink = { url: string; text: string };

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function visibleText(value: string) {
  return decodeHtml(value.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

export function extractHtmlLinks(html: string, baseUrl: string): HtmlLink[] {
  const links: HtmlLink[] = [];
  const anchor = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(anchor)) {
    const attributes = match[1] ?? "";
    const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attributes);
    const raw = decodeHtml(href?.[1] ?? href?.[2] ?? href?.[3] ?? "").trim();
    if (!raw || raw.startsWith("#") || /^(?:mailto|tel|javascript):/i.test(raw)) continue;
    try {
      links.push({ url: new URL(raw, baseUrl).href, text: visibleText(match[2] ?? "") });
    } catch {
      // Ignore malformed directory links.
    }
  }
  return links;
}

export function discoverDetailUrls(provider: DirectoryProvider, html: string, listingUrl: string) {
  const expectedHost = SOURCE_HOSTS[provider];
  const seen = new Set<string>();
  const results: string[] = [];
  for (const link of extractHtmlLinks(html, listingUrl)) {
    const url = new URL(link.url);
    if (url.hostname !== expectedHost) continue;
    const matches = provider === "product_hunt"
      ? /^\/products\/[^/?#]+\/?$/.test(url.pathname)
      : /(?:^|\/)tool\/[^/?#]+\/?$/.test(url.pathname);
    if (!matches) continue;
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/$/, "");
    if (!seen.has(url.href)) {
      seen.add(url.href);
      results.push(url.href);
    }
  }
  return results;
}

function normalizedHostname(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function isBlockedDestination(hostname: string) {
  const normalized = normalizedHostname(hostname);
  return Object.values(SOURCE_HOSTS).some((source) => normalized === normalizedHostname(source)) ||
    BLOCKED_DESTINATIONS.some((blocked) => normalized === blocked || normalized.endsWith(`.${blocked}`));
}

function candidateScore(link: HtmlLink, provider: DirectoryProvider) {
  const url = new URL(link.url);
  const label = link.text.toLowerCase();
  let score = 0;
  if (/visit (?:the )?website|open site|visit site|website|launch app/.test(label)) score += 100;
  if (!isBlockedDestination(url.hostname)) score += 25;
  if (url.hostname === SOURCE_HOSTS[provider] && /\/(?:r|redirect|out)\//.test(url.pathname)) score += 60;
  if (/login|sign up|advertis|submit|newsletter|share/.test(label)) score -= 100;
  return score;
}

export function officialLinkCandidates(provider: DirectoryProvider, html: string, detailUrl: string) {
  return extractHtmlLinks(html, detailUrl)
    .map((link) => ({ ...link, score: candidateScore(link, provider) }))
    .filter((link) => link.score >= 60)
    .sort((left, right) => right.score - left.score)
    .map((link) => link.url)
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 12);
}

function externalId(provider: DirectoryProvider, detailUrl: string) {
  const parts = new URL(detailUrl).pathname.split("/").filter(Boolean);
  const marker = provider === "product_hunt" ? "products" : "tool";
  const index = parts.lastIndexOf(marker);
  return parts[index + 1] ?? parts.at(-1) ?? crypto.randomUUID();
}

export async function resolveOfficialWebsite(
  provider: DirectoryProvider,
  detailUrl: string,
  html: string,
  fetcher: typeof fetch = fetch,
): Promise<DiscoveredCatalogUrl | null> {
  for (const input of officialLinkCandidates(provider, html, detailUrl)) {
    let url: URL;
    try {
      url = assertPublicHttpsUrl(input);
    } catch {
      continue;
    }
    try {
      for (let redirects = 0; redirects <= 5; redirects += 1) {
        const response = await fetcher(url.href, {
          headers: {
            accept: "text/html,application/xhtml+xml",
            "user-agent": "OrdalinCatalogBot/0.1 (+https://ordalin.com/about/ranking)",
          },
          redirect: "manual",
          signal: AbortSignal.timeout(12_000),
        });
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get("location");
          await response.body?.cancel();
          if (!location) break;
          url = assertPublicHttpsUrl(new URL(location, url).href);
          continue;
        }
        await response.body?.cancel();
        if (!response.ok || isBlockedDestination(url.hostname)) break;
        const official = cleanCatalogWebsiteUrl(url);
        return {
          provider,
          externalId: externalId(provider, detailUrl),
          discoveryUrl: detailUrl,
          websiteUrl: official.href,
        };
      }
    } catch {
      // Try the next plausible official-site link.
    }
  }
  return null;
}
