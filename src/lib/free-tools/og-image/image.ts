/**
 * Reads an image's format and pixel size from its first bytes, so the checker
 * reports the real dimensions instead of trusting og:image:width/height.
 */
export type ImageFormat = "png" | "jpeg" | "gif" | "webp" | "avif" | "svg" | "bmp";
export type ImageInfo = { format: ImageFormat | null; width: number | null; height: number | null };

const ascii = (bytes: Uint8Array, start: number, length: number) => String.fromCharCode(...bytes.subarray(start, start + length));
const be16 = (bytes: Uint8Array, at: number) => (bytes[at] << 8) | bytes[at + 1];
const be32 = (bytes: Uint8Array, at: number) => ((bytes[at] << 24) | (bytes[at + 1] << 16) | (bytes[at + 2] << 8) | bytes[at + 3]) >>> 0;
const le16 = (bytes: Uint8Array, at: number) => bytes[at] | (bytes[at + 1] << 8);
const le24 = (bytes: Uint8Array, at: number) => bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16);

function jpegSize(bytes: Uint8Array) {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    if (marker === 0xff) {
      offset += 1;
      continue;
    }
    if ((marker >= 0xd0 && marker <= 0xd9) || marker === 0x01) {
      offset += 2;
      continue;
    }
    // Start-of-frame markers carry the size; C4, C8 and CC are other tables.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { width: be16(bytes, offset + 7), height: be16(bytes, offset + 5) };
    }
    offset += 2 + be16(bytes, offset + 2);
  }
  return null;
}

function webpSize(bytes: Uint8Array) {
  const chunk = ascii(bytes, 12, 4);
  if (chunk === "VP8 " && bytes.length >= 30) return { width: le16(bytes, 26) & 0x3fff, height: le16(bytes, 28) & 0x3fff };
  if (chunk === "VP8L" && bytes.length >= 25) {
    const [b0, b1, b2, b3] = bytes.subarray(21, 25);
    return { width: 1 + (((b1 & 0x3f) << 8) | b0), height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)) };
  }
  if (chunk === "VP8X" && bytes.length >= 30) return { width: 1 + le24(bytes, 24), height: 1 + le24(bytes, 27) };
  return null;
}

function avifSize(bytes: Uint8Array) {
  for (let at = 0; at + 16 <= bytes.length; at += 1) {
    if (bytes[at] === 0x69 && ascii(bytes, at, 4) === "ispe") return { width: be32(bytes, at + 8), height: be32(bytes, at + 12) };
  }
  return null;
}

export function imageInfo(bytes: Uint8Array): ImageInfo {
  const none = { width: null, height: null };
  if (bytes.length >= 24 && bytes[0] === 0x89 && ascii(bytes, 1, 3) === "PNG") {
    return { format: "png", width: be32(bytes, 16), height: be32(bytes, 20) };
  }
  if (bytes.length >= 10 && ascii(bytes, 0, 4) === "GIF8") return { format: "gif", width: le16(bytes, 6), height: le16(bytes, 8) };
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return { format: "jpeg", ...(jpegSize(bytes) ?? none) };
  if (bytes.length >= 16 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return { format: "webp", ...(webpSize(bytes) ?? none) };
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp" && /avi[fs]/.test(ascii(bytes, 8, Math.min(32, bytes.length - 8)))) {
    return { format: "avif", ...(avifSize(bytes) ?? none) };
  }
  if (bytes.length >= 26 && ascii(bytes, 0, 2) === "BM") {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { format: "bmp", width: view.getInt32(18, true), height: Math.abs(view.getInt32(22, true)) };
  }
  const start = new TextDecoder().decode(bytes.subarray(0, 1024)).trimStart().toLowerCase();
  if (start.startsWith("<svg") || (start.startsWith("<?xml") && start.includes("<svg"))) return { format: "svg", ...none };
  return { format: null, ...none };
}
