import sharp from "sharp";

export type LogoMeasure = { width: number; height: number };

/**
 * Rank a candidate for a square tool-mark tile. Wordmarks and banners score
 * low because they shrink to an unreadable strip; tiny favicons score low
 * because they blur when scaled to the 72px hero tile.
 */
export function logoScore({ width, height }: LogoMeasure) {
  if (!width || !height) return 0;
  const squareness = Math.min(width, height) / Math.max(width, height);
  const resolution = Math.min(1, Math.max(width, height) / 128);
  return squareness * resolution;
}

/** Visible bounds after removing a fully transparent border. */
export async function measureVisibleLogo(input: Uint8Array): Promise<LogoMeasure> {
  const image = sharp(input, { density: 256, limitInputPixels: 25_000_000, animated: false }).rotate();
  const { hasAlpha } = await image.metadata();
  const { info } = await (hasAlpha ? image.trim({ threshold: 0 }) : image).toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height };
}

/**
 * A plain tile with no visible mark, e.g. an icon whose artwork failed to
 * export: its opaque pixels are one flat color filling the visible bounds.
 * Single-color silhouettes still pass because their shape leaves gaps.
 */
export async function isBlankTile(input: Uint8Array) {
  const { data, info } = await sharp(input, { density: 256, limitInputPixels: 25_000_000, animated: false })
    .resize(64, 64, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let opaque = 0;
  let sum = 0;
  let sumSquares = 0;
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] < 128) continue;
    const luma = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
    opaque += 1;
    sum += luma;
    sumSquares += luma * luma;
  }
  if (!opaque) return true;
  const mean = sum / opaque;
  const flat = Math.sqrt(Math.max(0, sumSquares / opaque - mean * mean)) < 4;
  return flat && opaque / (info.width * info.height) > 0.85;
}

// Marketing art, banners and social cards that sites tag with "logo"-like hints.
const ILLUSTRATION_HINT = /(?:^|[/_\-.\s])(?:frame|hero|banner|cover|social|og|opengraph|twitter|share|illustration|screenshot|mockup|header|background|bg|poster)(?:[_\-.\d\s]|$)/i;

export type LogoContext = {
  /** Icons the site declares for itself: `<link rel=icon|apple-touch-icon>`, manifest icons, well-known paths. */
  declared: Set<string>;
  /** Lowercase alphanumeric brand names, e.g. the tool name and domain label. */
  brands: string[];
};

const compact = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

/** Brand stems for matching logo file names: the tool name, slug and main domain label. */
export function brandStems(name: string, slug: string, websiteUrl: string) {
  const label = new URL(websiteUrl).hostname.replace(/^www\./, "").split(".")[0];
  return [...new Set([compact(name), compact(slug), compact(label)])].filter((stem) => stem.length >= 3);
}

/**
 * Prior belief that a URL is this tool's mark rather than page artwork. Icons
 * the site declares for itself keep full weight. Other `<img>` "logo" hits are
 * often customer, integration or press logos, so they need the brand in the
 * URL; artwork (banners, social cards, logo walls) is never a candidate.
 */
export function logoUrlPrior(input: string, context: LogoContext) {
  if (context.declared.has(input)) return 1;
  if (looksLikeArtwork(input)) return 0;
  const url = new URL(input);
  // The path, not the host: a site's own integration and customer logos live on its domain too.
  const location = compact(`${decodeURIComponent(url.pathname)} ${url.searchParams.get("url") ?? ""}`);
  return context.brands.some((brand) => location.includes(brand)) ? 1 : 0.4;
}

// Folders that hold other companies' marks: logo walls, integrations, press.
const THIRD_PARTY_FOLDER = /\/(?:[^/]*[-_])?(?:carousel|customers?|clients?|partners?|integrations?|press|testimonials?|companies|brands|apps)(?:[-_][^/]*)?\//i;

/** Page artwork rather than a mark: banners, social cards, third-party logo walls, banner-width requests. */
export function looksLikeArtwork(input: string) {
  const url = new URL(input);
  const file = decodeURIComponent(url.pathname.split("/").pop() ?? "");
  const requestedWidth = Number(url.searchParams.get("w") ?? url.searchParams.get("width") ?? 0);
  return ILLUSTRATION_HINT.test(file) || THIRD_PARTY_FOLDER.test(decodeURIComponent(url.pathname)) || requestedWidth > 640;
}

const ICON_RELS = new Set(["icon", "apple-touch-icon", "apple-touch-icon-precomposed"]);

/** `<link rel="icon" | "apple-touch-icon">` targets declared in a page, as absolute HTTPS URLs. */
export function declaredIconUrls(html: string, pageUrl: string) {
  const urls: string[] = [];
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const value = (name: string) => {
      const match = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
      return (match?.[1] ?? match?.[2] ?? match?.[3] ?? "").replaceAll("&amp;", "&").trim();
    };
    if (!value("rel").toLowerCase().split(/\s+/).some((rel) => ICON_RELS.has(rel))) continue;
    try {
      const url = new URL(value("href"), pageUrl);
      if (url.protocol === "https:" && !urls.includes(url.href)) urls.push(url.href);
    } catch {
      // Ignore malformed hrefs.
    }
  }
  return urls;
}

/**
 * Extract the largest image from a Windows ICO container as PNG, since sharp
 * cannot decode ICO. Returns null when the bytes are not an ICO file.
 */
export async function icoToPng(input: Uint8Array): Promise<Buffer | null> {
  const view = new DataView(input.buffer, input.byteOffset, input.byteLength);
  if (input.byteLength < 6 || view.getUint16(0, true) !== 0 || view.getUint16(2, true) !== 1) return null;
  const count = view.getUint16(4, true);
  let best: { width: number; size: number; offset: number } | null = null;
  for (let index = 0; index < count && 6 + index * 16 + 16 <= input.byteLength; index += 1) {
    const entry = 6 + index * 16;
    const width = input[entry] || 256;
    const size = view.getUint32(entry + 8, true);
    const offset = view.getUint32(entry + 12, true);
    if (offset + size > input.byteLength) continue;
    if (!best || width > best.width) best = { width, size, offset };
  }
  if (!best) return null;
  const image = input.subarray(best.offset, best.offset + best.size);
  if (image[0] === 0x89 && image[1] === 0x50 && image[2] === 0x4e && image[3] === 0x47) return Buffer.from(image);
  return bmpEntryToPng(image);
}

/** ICO BMP entries: a BITMAPINFOHEADER, bottom-up pixels, then a 1-bit AND mask. */
async function bmpEntryToPng(image: Uint8Array) {
  const view = new DataView(image.buffer, image.byteOffset, image.byteLength);
  const headerSize = view.getUint32(0, true);
  const width = view.getInt32(4, true);
  const height = view.getInt32(8, true) / 2;
  const bits = view.getUint16(14, true);
  if (width <= 0 || height <= 0 || width > 512 || (bits !== 32 && bits !== 24)) return null;
  const stride = Math.ceil((width * bits) / 32) * 4;
  const maskStride = Math.ceil(width / 32) * 4;
  const maskStart = headerSize + stride * height;
  if (maskStart > image.byteLength) return null;
  const hasMask = maskStart + maskStride * height <= image.byteLength;
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const row = headerSize + (height - 1 - y) * stride;
    const maskRow = maskStart + (height - 1 - y) * maskStride;
    for (let x = 0; x < width; x += 1) {
      const pixel = row + x * (bits / 8);
      const target = (y * width + x) * 4;
      rgba[target] = image[pixel + 2];
      rgba[target + 1] = image[pixel + 1];
      rgba[target + 2] = image[pixel];
      const masked = hasMask && (image[maskRow + (x >> 3)] >> (7 - (x & 7))) & 1;
      rgba[target + 3] = bits === 32 ? image[pixel + 3] : masked ? 0 : 255;
    }
  }
  return sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer();
}
