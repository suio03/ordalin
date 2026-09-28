import type {
  AssetCandidate,
  CandidateValue,
} from "./contract.ts";

const SPACE = /\s+/g;

function decodeEntities(value: string) {
  return value
    .replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (entity, code: string) => {
      const point = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code);
      return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
    })
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function plainText(value: string) {
  const content = value.replace(/<(script|style|noscript|svg|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ");
  return decodeEntities(content.replace(/<[^>]+>/g, " ")).replace(SPACE, " ").trim();
}

function attr(tag: string, name: string) {
  const match = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
  return decodeEntities(match?.[1] ?? match?.[2] ?? match?.[3] ?? "").trim();
}

function absoluteUrl(value: string, pageUrl: string) {
  if (!value) return null;
  try {
    const url = new URL(value, pageUrl);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function meta(html: string, key: string) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const identity = attr(tag, "property") || attr(tag, "name");
    if (identity.toLowerCase() === key.toLowerCase()) return attr(tag, "content") || null;
  }
  return null;
}

function structuredRecords(html: string) {
  const records: Record<string, unknown>[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (!value || typeof value !== "object") return;
    const record = value as Record<string, unknown>;
    records.push(record);
    if (record["@graph"]) visit(record["@graph"]);
  };

  for (const match of html.matchAll(/<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      visit(JSON.parse(match[1]));
    } catch {
      // Malformed structured data is ignored and left for human review.
    }
  }
  return records;
}

function structuredImage(value: unknown) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  return typeof record.url === "string"
    ? record.url
    : typeof record.contentUrl === "string"
      ? record.contentUrl
      : null;
}

export function extractPage(html: string, pageUrl: string) {
  const records = structuredRecords(html);
  const application = records.find((record) => {
    const type = String(record["@type"] ?? "").toLowerCase();
    return type.includes("softwareapplication") || type.includes("webapplication");
  });
  const rawTitle = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "";
  const title = meta(html, "og:title") || plainText(rawTitle) || null;
  const description = meta(html, "og:description") || meta(html, "description") || null;
  const source = pageUrl;
  const name = String(application?.name ?? meta(html, "application-name") ?? meta(html, "og:site_name") ?? "").trim();
  const tagline = String(application?.description ?? description ?? "").trim();
  const assets: AssetCandidate[] = [];
  const addAsset = (kind: AssetCandidate["kind"], value: string | null) => {
    const url = absoluteUrl(value ?? "", pageUrl);
    if (url && !assets.some((candidate) => candidate.value === url)) assets.push({ kind, value: url, sourceUrl: source });
  };

  for (const record of records) addAsset("logo", structuredImage(record.logo));
  let manifestUrl: string | null = null;
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    const rel = attr(tag, "rel").toLowerCase().split(SPACE);
    if (rel.includes("apple-touch-icon") || rel.includes("apple-touch-icon-precomposed")) addAsset("logo", attr(tag, "href"));
    else if (rel.includes("icon") || (rel.includes("shortcut") && rel.includes("icon"))) addAsset("icon", attr(tag, "href"));
    if (rel.includes("manifest")) manifestUrl = absoluteUrl(attr(tag, "href"), pageUrl);
  }
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    const src = attr(tag, "src");
    const hint = `${attr(tag, "class")} ${attr(tag, "id")} ${attr(tag, "alt")} ${src}`;
    if (/(?:\blogo\b|\bbrand(?:[-_ ]?(?:mark|icon))?\b|\bsite[-_ ]?icon\b)/i.test(hint)) {
      addAsset("logo", src);
    }
  }
  addAsset("social_preview", meta(html, "og:image"));

  const platforms: CandidateValue<string>[] = [];
  const addPlatform = (value: string, evidence: string) => {
    if (!platforms.some((candidate) => candidate.value.toLowerCase() === value.toLowerCase())) {
      platforms.push({ value, sourceUrl: source, evidence });
    }
  };
  const operatingSystem = application?.operatingSystem;
  const platformValues = Array.isArray(operatingSystem)
    ? operatingSystem
    : typeof operatingSystem === "string"
      ? operatingSystem.split(/,|\band\b/i)
      : [];
  for (const value of platformValues) {
    const platform = String(value).trim();
    if (platform) addPlatform(platform, "SoftwareApplication operatingSystem");
  }

  const headings = Array.from(html.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi))
    .map((match) => plainText(match[1]))
    .filter(Boolean)
    .slice(0, 12);

  const links = Array.from(html.matchAll(/<a\b[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi)).map((match) => ({
    url: absoluteUrl(match[1] ?? match[2] ?? match[3] ?? "", pageUrl),
    text: plainText(match[4]),
  }));

  const structuredFacts = application ? JSON.stringify({ name: application.name, description: application.description, featureList: application.featureList, operatingSystem: application.operatingSystem, offers: application.offers }) : "";
  const searchableText = [plainText(html), structuredFacts].filter(Boolean).join(" ").slice(0, 80_000);
  const platformPatterns: Array<[string, RegExp]> = [
    ["macOS", /\b(?:macOS|Mac app|for Mac)\b/i],
    ["Windows", /\bWindows(?: 10| 11)?\b/i],
    ["Linux", /\bLinux\b/i],
    ["iOS", /\biOS\b/i],
    ["Android", /\bAndroid\b/i],
    ["Browser extension", /\bbrowser extension\b/i],
    ["Web app", /\b(?:web app|browser-based)\b/i],
  ];
  const platformText = [title, description, tagline].filter(Boolean).join(" ");
  for (const [platform, pattern] of platformPatterns) {
    const match = pattern.exec(platformText);
    if (match) addPlatform(platform, match[0]);
  }

  return {
    title,
    description,
    name: name ? { value: name, sourceUrl: source } : null,
    tagline: tagline ? { value: tagline, sourceUrl: source } : null,
    assets,
    platforms,
    headings,
    links,
    manifestUrl,
    searchableText,
  };
}
