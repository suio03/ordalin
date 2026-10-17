import { attr, meta, plainText } from "@/lib/catalog-enrichment/html";
import { assertPublicHttpsUrl } from "@/lib/catalog-enrichment/url-policy";
import type { FetchedResource, VisibilityCheck } from "@/lib/free-tools/ai-visibility/checks";
import { browserUserAgent } from "@/lib/free-tools/ai-visibility/crawlers";
import { fetchResource } from "@/lib/free-tools/ai-visibility/fetch";
import { imageInfo, type ImageInfo } from "./image";

const PAGE_BYTES = 1_000_000;
// Enough for the size fields even when a JPEG carries a large EXIF or colour profile.
const IMAGE_HEAD_BYTES = 512_000;
// Without a content-length, count the bytes up to here to report the file size.
const IMAGE_COUNT_LIMIT = 20_000_000;
const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 8_000;
// X does not show card images over 5 MB, the lowest limit of the major platforms.
const IMAGE_FILE_LIMIT = 5_000_000;

export type OgPreview = {
  url: string;
  domain: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  /** Only an https image the checker could load, so the page can show it. */
  image: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  twitterCard: string | null;
  twitterImage: string | null;
};

export type OgCheckReport = {
  website: string;
  pageUrl: string;
  /** False when the page did not load as HTML; only the page check is reported. */
  found: boolean;
  checks: VisibilityCheck[];
  preview: OgPreview | null;
  generatedAt: string;
};

type FetchedImage = {
  status: number | null;
  url: string;
  contentType?: string;
  bytes: number | null;
  info: ImageInfo | null;
  error?: string;
};

const ok = (status: number | null) => status !== null && status >= 200 && status < 300;
const blocked = (status: number | null) => status === 401 || status === 403 || status === 429;
const clip = (value: string, length = 120) => (value.length > length ? `${value.slice(0, length - 1)}…` : value);
const sameUrl = (left: string, right: string) => left.replace(/\/$/, "") === right.replace(/\/$/, "");
const kb = (bytes: number) => (bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`);

function canonicalHref(html: string) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    if (attr(match[0], "rel").toLowerCase().split(/\s+/).includes("canonical")) return attr(match[0], "href") || null;
  }
  return null;
}

function resolve(value: string | null, base: string) {
  if (!value) return null;
  try {
    return new URL(value, base).href;
  } catch {
    return null;
  }
}

/** Follows redirects by hand like fetchResource, but keeps raw bytes for the size fields. Never throws. */
export async function fetchImage(target: string, fetcher: typeof fetch): Promise<FetchedImage> {
  let url = target;
  try {
    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
      assertPublicHttpsUrl(url);
      const response = await fetcher(url, {
        headers: { accept: "image/avif,image/webp,image/png,image/*;q=0.8,*/*;q=0.5", "user-agent": browserUserAgent },
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        await response.body?.cancel().catch(() => undefined);
        if (!location) return { status: response.status, url, bytes: null, info: null, error: "Redirect without a location" };
        url = new URL(location, url).href;
        continue;
      }
      const contentType = response.headers.get("content-type") ?? undefined;
      if (!ok(response.status) || !response.body) {
        await response.body?.cancel().catch(() => undefined);
        return { status: response.status, url, contentType, bytes: null, info: null };
      }
      const declared = Number(response.headers.get("content-length") ?? "");
      const reader = response.body.getReader();
      const head = new Uint8Array(IMAGE_HEAD_BYTES);
      let filled = 0;
      let counted = 0;
      while (counted < IMAGE_COUNT_LIMIT) {
        const { done, value } = await reader.read();
        if (done) break;
        if (filled < head.length) {
          const part = value.subarray(0, head.length - filled);
          head.set(part, filled);
          filled += part.byteLength;
        }
        counted += value.byteLength;
        // With a content-length there is no need to download the rest.
        if (declared > 0 && filled >= Math.min(head.length, declared)) break;
      }
      await reader.cancel().catch(() => undefined);
      return {
        status: response.status,
        url,
        contentType,
        bytes: declared > 0 ? declared : counted,
        info: imageInfo(head.subarray(0, filled)),
      };
    }
    return { status: null, url, bytes: null, info: null, error: "Too many redirects" };
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return { status: null, url, bytes: null, info: null, error: timedOut ? "Timed out" : /HTTPS|Private/.test(String(error)) ? "Not a public https:// address" : "Could not connect" };
  }
}

function pageCheck(page: FetchedResource, requested: string): VisibilityCheck {
  const base = { id: "page", title: "Page loads" };
  const label = page.status === null ? page.error ?? "no response" : `HTTP ${page.status}`;
  const evidence = [`${requested}: ${label}${page.contentType ? `, ${page.contentType}` : ""}`];
  if (!sameUrl(page.url, requested)) evidence.push(`Redirects to ${page.url}`);
  if (blocked(page.status)) {
    return {
      ...base,
      status: "fail",
      summary: `The site blocked our request (${label}). Some sites block unknown visitors; if it also blocks the crawlers of X, Facebook or LinkedIn, links to it show no preview.`,
      fix: "Allow facebookexternalhit, Twitterbot, LinkedInBot and Slackbot in your firewall or bot protection settings.",
      evidence,
    };
  }
  if (!ok(page.status)) {
    return { ...base, status: "fail", summary: `The page did not load (${label}).`, fix: "Check the address, or test a page that loads in a browser.", evidence };
  }
  if (!/html/i.test(page.contentType ?? "") && !/<html|<head|<meta/i.test(page.body ?? "")) {
    return { ...base, status: "fail", summary: "The address is not an HTML page, so it has no Open Graph tags.", fix: "Enter the address of a web page.", evidence };
  }
  return { ...base, status: "pass", summary: "The page loads.", evidence };
}

function imageChecks(raw: string | null, resolved: string | null, image: FetchedImage | null, declared: { width: number; height: number } | null, twitterImage: string | null): VisibilityCheck[] {
  const tag = { id: "og-image", title: "og:image tag" };
  if (!raw) {
    return [{
      ...tag,
      status: "fail",
      summary: twitterImage
        ? "No og:image tag. X can use twitter:image, but Facebook, LinkedIn, Slack and most chat apps need og:image to show a picture."
        : "No og:image tag, so links to this page are shared without a picture.",
      fix: "Add a 1200 × 630 image to the page head.",
      snippet: `<meta property="og:image" content="https://your-site.com/og.png" />\n<meta property="og:image:width" content="1200" />\n<meta property="og:image:height" content="630" />`,
      evidence: twitterImage ? [`twitter:image: ${clip(twitterImage)}`] : [],
    }];
  }

  const checks: VisibilityCheck[] = [];
  const relative = !/^https?:\/\//i.test(raw);
  const insecure = /^http:\/\//i.test(resolved ?? "");
  checks.push(relative || insecure
    ? {
        ...tag,
        status: "warn",
        summary: relative
          ? "og:image is a relative path. The Open Graph protocol expects a full URL, and some platforms do not resolve relative paths."
          : "og:image uses http://. Some platforms skip insecure images; serve it over https://.",
        fix: "Use the full https:// address of the image.",
        evidence: [`og:image: ${clip(raw)}`, ...(relative && resolved ? [`Resolves to ${clip(resolved)}`] : [])],
      }
    : { ...tag, status: "pass", summary: "The page has an og:image tag with a full URL.", evidence: [`og:image: ${clip(raw)}`] });

  // Image loads
  const load = { id: "image-load", title: "Image loads" };
  if (!image || !resolved) {
    checks.push({ ...load, status: "info", summary: insecure ? "Not checked, because the image uses http://." : "Not checked, because og:image is not a valid URL.", evidence: [] });
    return checks;
  }
  const label = image.status === null ? image.error ?? "no response" : `HTTP ${image.status}`;
  const evidence = [`${clip(resolved)}: ${label}${image.contentType ? `, ${image.contentType}` : ""}`];
  if (!sameUrl(image.url, resolved)) evidence.push(`Redirects to ${clip(image.url)}`);
  if (blocked(image.status)) {
    checks.push({ ...load, status: "warn", summary: `The image server blocked our request (${label}). Platforms may be blocked too.`, fix: "Make sure the image is public and that bot protection allows link-preview crawlers.", evidence });
    return checks;
  }
  if (!ok(image.status)) {
    checks.push({ ...load, status: "fail", summary: `The image did not load (${label}), so shares show no picture.`, fix: "Point og:image to an image that loads, or upload the missing file.", evidence });
    return checks;
  }
  if (!image.info?.format && !/^image\//i.test(image.contentType ?? "")) {
    checks.push({ ...load, status: "fail", summary: "The og:image address returns something that is not an image, often an HTML page.", fix: "Point og:image to the image file itself.", evidence });
    return checks;
  }
  checks.push({ ...load, status: "pass", summary: `The image loads${image.bytes ? ` (${kb(image.bytes)})` : ""}.`, evidence });

  // Image size
  const size = { id: "image-size", title: "Image size" };
  const width = image.info?.width ?? null;
  const height = image.info?.height ?? null;
  if (!width || !height) {
    checks.push({ ...size, status: "info", summary: "We could not read the image size from the file.", evidence: [] });
  } else {
    const actual = `${width} × ${height}`;
    const ratio = width / height;
    const mismatch = declared && (declared.width !== width || declared.height !== height) ? `og:image:width and og:image:height say ${declared.width} × ${declared.height}, but the image is ${actual}.` : "";
    const sizeEvidence = [`Image: ${actual} px, ratio ${ratio.toFixed(2)}:1`, ...(declared ? [`Tags: ${declared.width} × ${declared.height}`] : [])];
    if (width < 200 || height < 200) {
      checks.push({ ...size, status: "fail", summary: `The image is ${actual}. Facebook needs at least 200 × 200 and other platforms may skip images this small.`, fix: "Use a 1200 × 630 image.", evidence: sizeEvidence });
    } else if (width < 600 || height < 315 || ratio < 1.7 || ratio > 2.1 || mismatch) {
      const problems = [
        width < 600 || height < 315 ? `At ${actual}, Facebook shows it as a small thumbnail instead of a large card.` : "",
        ratio < 1.7 || ratio > 2.1 ? `The ratio is ${ratio.toFixed(2)}:1; large previews are about 1.91:1, so the image will be cropped.` : "",
        mismatch,
      ].filter(Boolean);
      checks.push({
        ...size,
        status: "warn",
        summary: problems.join(" "),
        fix: mismatch && problems.length === 1 ? "Update og:image:width and og:image:height to the real size, or remove them." : "Use a 1200 × 630 image and keep important text away from the edges.",
        evidence: sizeEvidence,
      });
    } else {
      checks.push({
        ...size,
        status: "pass",
        summary: `${actual}, a ${ratio.toFixed(2)}:1 ratio that fits large previews.${width < 1200 ? " 1200 × 630 looks sharper on high-density screens." : ""}`,
        evidence: sizeEvidence,
      });
    }
  }

  // Image file
  const file = { id: "image-file", title: "Image format and file size" };
  const format = image.info?.format ?? null;
  const fileEvidence = [`Format: ${format?.toUpperCase() ?? image.contentType ?? "unknown"}`, ...(image.bytes ? [`File size: ${kb(image.bytes)}`] : [])];
  if (format === "svg") {
    checks.push({ ...file, status: "fail", summary: "The image is an SVG. X, Facebook and LinkedIn do not show SVG images in link previews.", fix: "Export the image as PNG or JPEG.", evidence: fileEvidence });
  } else if (image.bytes && image.bytes > IMAGE_FILE_LIMIT) {
    checks.push({ ...file, status: "fail", summary: `The file is ${kb(image.bytes)}. X does not show images over 5 MB, and large files load slowly everywhere.`, fix: "Compress the image or export it as JPEG; most OG images fit in under 1 MB.", evidence: fileEvidence });
  } else if (format !== "png" && format !== "jpeg" && format !== "gif" && format !== "webp") {
    checks.push({ ...file, status: "warn", summary: `${format ? format.toUpperCase() : "This format"} is not supported by every platform.`, fix: "Use PNG or JPEG, which every major platform shows.", evidence: fileEvidence });
  } else {
    checks.push({
      ...file,
      status: "pass",
      summary: `${format.toUpperCase()}${image.bytes ? `, ${kb(image.bytes)}` : ""}.${format === "webp" ? " Most platforms show WebP; if one shows no image, switch to PNG or JPEG." : ""}`,
      evidence: [],
    });
  }
  return checks;
}

function textChecks(html: string, pageUrl: string) {
  const ogTitle = meta(html, "og:title");
  const htmlTitle = plainText(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "") || null;
  const ogDescription = meta(html, "og:description");
  const description = meta(html, "description");
  const checks: VisibilityCheck[] = [];

  const title = { id: "og-title", title: "og:title" };
  if (ogTitle) {
    checks.push({
      ...title,
      status: "pass",
      summary: `“${clip(ogTitle)}” (${ogTitle.length} characters).${ogTitle.length > 70 ? " Most previews cut titles after about 60–70 characters." : ""}`,
      evidence: [],
    });
  } else {
    checks.push({
      ...title,
      status: htmlTitle ? "warn" : "fail",
      summary: htmlTitle
        ? "No og:title tag. Most platforms fall back to the page <title>, but not all of them do."
        : "No og:title tag and no page <title>, so previews have no headline.",
      fix: "Add og:title with the headline you want in shares.",
      snippet: `<meta property="og:title" content="${(htmlTitle ?? "Your page title").replace(/"/g, "&quot;")}" />`,
      evidence: htmlTitle ? [`<title>: “${clip(htmlTitle)}”`] : [],
    });
  }

  const desc = { id: "og-description", title: "og:description" };
  if (ogDescription) {
    checks.push({
      ...desc,
      status: "pass",
      summary: `“${clip(ogDescription, 160)}” (${ogDescription.length} characters).${ogDescription.length > 200 ? " Previews show only the first one or two lines." : ""}`,
      evidence: [],
    });
  } else {
    checks.push({
      ...desc,
      status: "warn",
      summary: description
        ? "No og:description tag. Some platforms use the meta description instead; others show no description."
        : "No og:description and no meta description, so previews show only the title.",
      fix: "Add one or two sentences about the page.",
      snippet: `<meta property="og:description" content="${(description ?? "What this page is about, in one or two sentences.").replace(/"/g, "&quot;")}" />`,
      evidence: description ? [`meta description: “${clip(description, 160)}”`] : [],
    });
  }

  const urlCheck = { id: "og-url", title: "og:url" };
  const ogUrl = resolve(meta(html, "og:url"), pageUrl);
  const canonical = resolve(canonicalHref(html), pageUrl);
  if (!ogUrl) {
    checks.push({
      ...urlCheck,
      status: "warn",
      summary: "No og:url tag. Platforms then use the shared address, so shares with different tracking parameters are counted as different pages.",
      fix: "Set og:url to the page's canonical URL.",
      snippet: `<meta property="og:url" content="${canonical ?? pageUrl}" />`,
      evidence: canonical ? [`Canonical: ${canonical}`] : [],
    });
  } else if (canonical && !sameUrl(ogUrl, canonical)) {
    checks.push({
      ...urlCheck,
      status: "warn",
      summary: "og:url and the canonical URL point to different addresses.",
      fix: "Use the same URL in og:url and the canonical link.",
      evidence: [`og:url: ${clip(ogUrl)}`, `Canonical: ${clip(canonical)}`],
    });
  } else {
    checks.push({ ...urlCheck, status: "pass", summary: canonical ? "og:url matches the canonical URL." : "The page has an og:url tag.", evidence: [`og:url: ${clip(ogUrl)}`] });
  }
  return { checks, ogTitle: ogTitle ?? htmlTitle, ogDescription: ogDescription ?? description };
}

function twitterCheck(card: string | null, twitterImage: string | null, ogImage: string | null, image: FetchedImage | null): VisibilityCheck {
  const base = { id: "twitter-card", title: "X (Twitter) card" };
  const evidence = [`twitter:card: ${card ?? "missing"}`, ...(twitterImage ? [`twitter:image: ${clip(twitterImage)}`] : [])];
  const separate = twitterImage && twitterImage !== ogImage;
  const broken = separate && image && !ok(image.status) && !blocked(image.status);
  if (broken) {
    return { ...base, status: "warn", summary: `twitter:image does not load (${image.status === null ? image.error ?? "no response" : `HTTP ${image.status}`}), so X shows no picture.`, fix: "Fix the address or remove twitter:image so X uses og:image.", evidence };
  }
  if (!card) {
    return {
      ...base,
      status: "warn",
      summary: "No twitter:card tag. Without it, X may show a small card or only the link.",
      fix: "Add a twitter:card tag; X reads the title, description and image from the Open Graph tags.",
      snippet: `<meta name="twitter:card" content="summary_large_image" />`,
      evidence,
    };
  }
  if (card === "summary") {
    return { ...base, status: "info", summary: "twitter:card is “summary”, so X shows a small square image next to the title. Use “summary_large_image” for a wide image.", evidence };
  }
  return { ...base, status: "pass", summary: `twitter:card is “${clip(card, 40)}”.${separate ? " X uses twitter:image instead of og:image." : ""}`, evidence };
}

function extrasCheck(html: string): VisibilityCheck {
  const missing = ["og:type", "og:site_name", "og:image:alt"].filter((key) => !meta(html, key));
  return {
    id: "og-extras",
    title: "Other Open Graph tags",
    status: "info",
    summary: missing.length
      ? `Missing ${missing.join(", ")}. They are optional: og:type and og:site_name add context, and og:image:alt describes the image for screen readers.`
      : "Has og:type, og:site_name and og:image:alt.",
    evidence: [],
  };
}

export async function checkOgImage(target: URL, fetcher: typeof fetch = fetch, generatedAt = new Date()): Promise<OgCheckReport> {
  const requested = target.href;
  const page = await fetchResource(requested, fetcher, {
    userAgent: browserUserAgent,
    accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    readBody: true,
    maxBytes: PAGE_BYTES,
  });
  const report = { website: requested, pageUrl: page.url, generatedAt: generatedAt.toISOString() };
  const loaded = pageCheck(page, requested);
  if (loaded.status !== "pass") return { ...report, found: false, checks: [loaded], preview: null };

  const html = page.body ?? "";
  const rawImage = meta(html, "og:image") ?? meta(html, "og:image:url") ?? meta(html, "og:image:secure_url");
  const ogImage = resolve(rawImage, page.url);
  const rawTwitterImage = meta(html, "twitter:image") ?? meta(html, "twitter:image:src");
  const twitterImage = resolve(rawTwitterImage, page.url);
  const card = meta(html, "twitter:card");
  const declaredWidth = Number(meta(html, "og:image:width"));
  const declaredHeight = Number(meta(html, "og:image:height"));
  const declared = declaredWidth > 0 && declaredHeight > 0 ? { width: declaredWidth, height: declaredHeight } : null;

  const fetchable = (url: string | null) => (url && /^https:\/\//i.test(url) ? url : null);
  const separateTwitter = twitterImage && twitterImage !== ogImage ? fetchable(twitterImage) : null;
  const [image, twitter] = await Promise.all([
    fetchable(ogImage) ? fetchImage(ogImage as string, fetcher) : Promise.resolve(null),
    separateTwitter ? fetchImage(separateTwitter, fetcher) : Promise.resolve(null),
  ]);

  const text = textChecks(html, page.url);
  const shown = image && ok(image.status) && image.info?.format && image.info.format !== "svg" ? image.url : null;
  const host = new URL(page.url).hostname.replace(/^www\./, "");
  return {
    ...report,
    found: true,
    checks: [
      loaded,
      ...imageChecks(rawImage, ogImage, image, declared, twitterImage),
      ...text.checks,
      twitterCheck(card, twitterImage, ogImage, twitter),
      extrasCheck(html),
    ],
    preview: {
      url: page.url,
      domain: host,
      title: text.ogTitle,
      description: text.ogDescription,
      siteName: meta(html, "og:site_name"),
      image: shown,
      imageWidth: shown ? image?.info?.width ?? null : null,
      imageHeight: shown ? image?.info?.height ?? null : null,
      twitterCard: card,
      twitterImage: twitter && ok(twitter.status) && twitter.info?.format && twitter.info.format !== "svg" ? twitter.url : null,
    },
  };
}
