import type {
  CatalogEnrichmentCandidate,
  CandidatePricingModel,
  CandidateValue,
  EnrichmentEvidencePage,
  EnrichmentOptions,
} from "./contract.ts";
import { extractPage } from "./html.ts";
import { assertPublicHttpsUrl, robotsAllows, sameSite } from "./url-policy.ts";

const DEFAULT_MAX_PAGES = 4;
const DEFAULT_MAX_BYTES = 512_000;
const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_EVIDENCE_EXCERPT = 8_000;
const STANDARD_ICON_PATHS = [
  "/favicon.svg",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/icon.svg",
  "/icon.png",
  "/logo.svg",
  "/logo.png",
];
const IMAGE_TYPES = new Set([
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/vnd.microsoft.icon",
  "image/webp",
  "image/x-icon",
]);
const ROLE_MATCHERS: Array<[EnrichmentEvidencePage["role"], RegExp]> = [
  ["pricing", /\b(pricing|plans?|billing)\b/i],
  ["features", /\b(features?|capabilities|product)\b/i],
  ["docs", /\b(docs?|documentation|help|guides?|faq|limits?|export|retention|supported|integrations?)\b/i],
  ["security", /\b(security|trust)\b/i],
  ["privacy", /\bprivacy\b/i],
];

async function fetchText(
  initialUrl: URL,
  fetcher: typeof fetch,
  maxBytes: number,
  timeoutMs: number,
) {
  let url = initialUrl;
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    assertPublicHttpsUrl(url.href);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetcher(url.href, {
        headers: { accept: "text/html,application/xhtml+xml", "user-agent": "OrdalinCatalogBot/0.1 (+https://ordalin.com/about/ranking)" },
        redirect: "manual",
        signal: controller.signal,
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new Error(`Redirect without a location from ${url.href}`);
        url = assertPublicHttpsUrl(new URL(location, url).href);
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status} from ${url.href}`);
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
        throw new Error(`Unsupported content type from ${url.href}`);
      }
      const declaredLength = Number(response.headers.get("content-length") ?? 0);
      if (declaredLength > maxBytes) throw new Error(`Page exceeds ${maxBytes} bytes`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength > maxBytes) throw new Error(`Page exceeds ${maxBytes} bytes`);
      return { html: new TextDecoder().decode(bytes), url };
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error(`Too many redirects from ${initialUrl.href}`);
}

async function getRobots(origin: string, fetcher: typeof fetch, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(`${origin}/robots.txt`, { signal: controller.signal, redirect: "manual" });
    return response.ok ? await response.text() : "";
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchManifestIcons(
  manifestUrl: string,
  fetcher: typeof fetch,
  timeoutMs: number,
) {
  let url = assertPublicHttpsUrl(manifestUrl);
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetcher(url.href, {
        headers: { accept: "application/manifest+json,application/json" },
        redirect: "manual",
        signal: controller.signal,
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) return [];
        url = assertPublicHttpsUrl(new URL(location, url).href);
        continue;
      }
      if (!response.ok) return [];
      const declared = Number(response.headers.get("content-length") ?? 0);
      if (declared > 128_000) return [];
      const text = await response.text();
      if (text.length > 128_000) return [];
      const parsed = JSON.parse(text) as { icons?: Array<{ src?: unknown; sizes?: unknown; purpose?: unknown }> };
      if (!Array.isArray(parsed.icons)) return [];
      return parsed.icons
        .filter((icon) => typeof icon.src === "string")
        .sort((left, right) => {
          const leftMaskable = String(left.purpose ?? "").includes("maskable") ? 1 : 0;
          const rightMaskable = String(right.purpose ?? "").includes("maskable") ? 1 : 0;
          const leftSize = Math.max(...(String(left.sizes ?? "").match(/\d+/g) ?? ["0"]).map(Number));
          const rightSize = Math.max(...(String(right.sizes ?? "").match(/\d+/g) ?? ["0"]).map(Number));
          return rightMaskable - leftMaskable || rightSize - leftSize;
        })
        .map((icon) => new URL(String(icon.src), url).href)
        .filter((value) => {
          try {
            assertPublicHttpsUrl(value);
            return true;
          } catch {
            return false;
          }
        })
        .slice(0, 4);
    } catch {
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }
  return [];
}

async function probeImage(input: URL, fetcher: typeof fetch, timeoutMs: number) {
  let url = input;
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetcher(url.href, {
        headers: {
          accept: "image/*",
          range: "bytes=0-1023",
          "user-agent": "OrdalinCatalogBot/0.1 (+https://ordalin.com/about/ranking)",
        },
        redirect: "manual",
        signal: controller.signal,
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) return null;
        url = assertPublicHttpsUrl(new URL(location, url).href);
        continue;
      }
      const type = (response.headers.get("content-type") ?? "").split(";", 1)[0].toLowerCase();
      const size = Number(response.headers.get("content-length") ?? 0);
      const valid = response.ok && IMAGE_TYPES.has(type) && size <= 2_000_000;
      await response.body?.cancel();
      return valid ? url.href : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}

function pageRole(text: string) {
  return ROLE_MATCHERS.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
}

function pricingSignals(text: string, sourceUrl: string): CandidateValue<CandidatePricingModel>[] {
  const candidates: Array<[CandidatePricingModel, RegExp]> = [
    ["free_trial", /\b(?:free trial|try (?:it )?free for \d+ days?)\b/i],
    ["freemium", /\b(?:free plan|free tier|start for free|free forever)\b/i],
    ["free", /\b(?:free open.source|free and open.source|completely free|100% free)\b/i],
    ["contact_sales", /\b(?:contact sales|talk to sales|request (?:a )?quote)\b/i],
  ];
  const results: CandidateValue<CandidatePricingModel>[] = [];
  for (const [value, pattern] of candidates) {
    const match = pattern.exec(text);
    if (match) results.push({ value, sourceUrl, evidence: match[0] });
  }
  return results;
}

export async function enrichCatalogSite(input: string, options: EnrichmentOptions = {}): Promise<CatalogEnrichmentCandidate> {
  const fetcher = options.fetcher ?? fetch;
  const research = options.research === true;
  const maxPages = Math.min(research ? 12 : 6, Math.max(1, options.maxPages ?? (research ? 10 : DEFAULT_MAX_PAGES)));
  const maxBytes = Math.min(1_000_000, Math.max(64_000, options.maxBytesPerPage ?? DEFAULT_MAX_BYTES));
  const timeoutMs = Math.min(20_000, Math.max(1_000, options.timeoutMs ?? DEFAULT_TIMEOUT_MS));
  const requestedUrl = assertPublicHttpsUrl(input);
  const robotsByOrigin = new Map([[requestedUrl.origin, await getRobots(requestedUrl.origin, fetcher, timeoutMs)]]);
  const warnings: string[] = [];
  const queue: Array<{ url: URL; role: EnrichmentEvidencePage["role"] }> = [{ url: requestedUrl, role: "homepage" }];
  const seen = new Set<string>();
  const pages: EnrichmentEvidencePage[] = [];
  const assets: CatalogEnrichmentCandidate["assets"] = [];
  const platforms: CatalogEnrichmentCandidate["platforms"] = [];
  const pricing: CatalogEnrichmentCandidate["pricingSignals"] = [];
  const officialLinks: CatalogEnrichmentCandidate["officialLinks"] = [];
  let name: CatalogEnrichmentCandidate["identity"]["name"] = null;
  let tagline: CatalogEnrichmentCandidate["identity"]["tagline"] = null;
  let canonicalUrl = requestedUrl;

  const withinSite = (url: URL) => sameSite(canonicalUrl, url) || (research && url.hostname.endsWith(`.${canonicalUrl.hostname.replace(/^www\./, "")}`));
  const roleOrder = ["homepage", "pricing", "docs", "features", "privacy", "security"];
  while (queue.length && pages.length < maxPages && seen.size < maxPages * 3) {
    if (research) queue.sort((a, b) => {
      const priority = (role: string) => pages.filter(page => page.role === role).length * 10 + roleOrder.indexOf(role);
      return priority(a.role) - priority(b.role);
    });
    const queued = queue.shift();
    if (!queued || seen.has(queued.url.href)) continue;
    seen.add(queued.url.href);
    if (!robotsByOrigin.has(queued.url.origin)) robotsByOrigin.set(queued.url.origin, await getRobots(queued.url.origin, fetcher, timeoutMs));
    if (!robotsAllows(robotsByOrigin.get(queued.url.origin) ?? "", queued.url.pathname)) {
      warnings.push(`robots.txt disallows ${queued.url.pathname}`);
      continue;
    }
    try {
      const fetched = await fetchText(queued.url, fetcher, maxBytes, timeoutMs);
      if (pages.length === 0) canonicalUrl = fetched.url;
      else if (!withinSite(fetched.url)) throw new Error("Evidence redirected outside the official site");
      if (pages.some(page => page.url === fetched.url.href)) continue;
      seen.add(fetched.url.href);
      const extracted = extractPage(fetched.html, fetched.url.href);
      pages.push({
        url: fetched.url.href,
        role: queued.role,
        title: extracted.title,
        description: extracted.description,
        headings: extracted.headings,
        excerpt: extracted.searchableText.slice(0, research ? 16_000 : MAX_EVIDENCE_EXCERPT),
      });
      officialLinks.push({ role: queued.role, value: fetched.url.href, sourceUrl: fetched.url.href });
      name ??= extracted.name;
      tagline ??= extracted.tagline;
      for (const asset of extracted.assets) if (!assets.some((item) => item.value === asset.value)) assets.push(asset);
      if (queued.role === "homepage" && extracted.manifestUrl && sameSite(canonicalUrl, new URL(extracted.manifestUrl))) {
        const manifestIcons = await fetchManifestIcons(extracted.manifestUrl, fetcher, timeoutMs);
        for (const value of manifestIcons) {
          if (!assets.some((item) => item.value === value)) assets.push({ kind: "icon", value, sourceUrl: extracted.manifestUrl });
        }
      }
      for (const platform of extracted.platforms) if (!platforms.some((item) => item.value.toLowerCase() === platform.value.toLowerCase())) platforms.push(platform);
      for (const signal of pricingSignals(extracted.searchableText, fetched.url.href)) {
        if (!pricing.some((item) => item.value === signal.value)) pricing.push(signal);
      }

      if (queued.role === "homepage" || research) {
        const discoveries = extracted.links
          .map((link) => ({ ...link, role: pageRole(`${link.text} ${link.url ?? ""}`) }))
          .filter((link): link is { url: string; text: string; role: EnrichmentEvidencePage["role"] } => Boolean(link.url && link.role))
          .map((link) => {
            const url = new URL(link.url);
            url.hash = "";
            return { url, role: link.role };
          })
          .filter((link) => withinSite(link.url));
        for (const discovery of discoveries) {
          if (!seen.has(discovery.url.href) && !queue.some((item) => item.url.href === discovery.url.href) && queue.length < 120) queue.push(discovery);
        }
      }
    } catch (error) {
      warnings.push(`${queued.role}: ${error instanceof Error ? error.message : "fetch failed"}`);
    }
  }

  if (!pages.length) throw new Error(`No reviewable HTML pages could be fetched from ${requestedUrl.hostname}`);
  const standardIcons = await Promise.all(
    STANDARD_ICON_PATHS.map(async (path) => {
      const value = await probeImage(new URL(path, canonicalUrl.origin), fetcher, timeoutMs);
      return value ? { kind: "icon" as const, value, sourceUrl: canonicalUrl.href } : null;
    }),
  );
  for (const asset of standardIcons) {
    if (asset && !assets.some((item) => item.value === asset.value)) assets.push(asset);
  }
  return {
    schemaVersion: 1,
    status: "pending_review",
    websiteUrl: canonicalUrl.href,
    canonicalDomain: canonicalUrl.hostname.toLowerCase().replace(/^www\./, ""),
    fetchedAt: (options.fetchedAt ?? new Date()).toISOString(),
    identity: { name, tagline },
    assets: assets.slice(0, 8),
    pricingSignals: pricing,
    platforms,
    officialLinks,
    evidencePages: pages,
    warnings,
  };
}
