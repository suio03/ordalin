import { SubmissionError } from "./http";

const MAX_LOGO_BYTES = 2_000_000;

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

export function webpDimensions(bytes: Uint8Array) {
  if (bytes.length < 30 || ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WEBP") return null;
  const chunk = ascii(bytes, 12, 4);
  if (chunk === "VP8X") {
    const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
    const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    return { width, height };
  }
  if (chunk === "VP8 " && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    return {
      width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
      height: (bytes[28] | (bytes[29] << 8)) & 0x3fff,
    };
  }
  if (chunk === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
    const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

export async function validateSubmissionLogo(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.type !== "image/webp" || file.size > MAX_LOGO_BYTES) {
    throw new SubmissionError("Logo must be a WebP image no larger than 2 MB.", 400, "invalid_logo");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const dimensions = webpDimensions(bytes);
  if (!dimensions || dimensions.width < 32 || dimensions.height < 32 || dimensions.width > 1_024 || dimensions.height > 1_024) {
    throw new SubmissionError("Logo dimensions must be between 32 and 1024 pixels.", 400, "invalid_logo");
  }
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return { bytes, hash, width: dimensions.width, height: dimensions.height };
}

export async function validateSubmissionScreenshot(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || !file.size) return null;
  if (file.type !== "image/webp" || file.size > 4_000_000) throw new SubmissionError("Screenshot must be a WebP image no larger than 4 MB.", 400, "invalid_screenshot");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const size = webpDimensions(bytes);
  if (!size || size.width !== 1440 || size.height !== 900) throw new SubmissionError("Screenshot must be 1440 × 900 pixels.", 400, "invalid_screenshot");
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  return { bytes, hash, ...size };
}
