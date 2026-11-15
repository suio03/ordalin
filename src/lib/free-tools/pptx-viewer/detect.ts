// Tells what a dropped file is before the renderer sees it, so old .ppt,
// password-protected, OpenDocument, Keynote and broken files get their own
// message instead of a blank screen.
import { unzipSync } from "fflate";

export type DeckFormat = "pptx" | "ppsx" | "potx" | "pptm" | "ppsm" | "potm";
export type DetectError = "ppt" | "encrypted" | "odp" | "key" | "word" | "excel" | "pdf" | "empty" | "corrupt" | "unknown";
export type Detected = { ok: true; format: DeckFormat; macros: boolean } | { ok: false; error: DetectError };

const MAIN_TYPES: Record<string, DeckFormat> = {
  "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": "pptx",
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": "ppsx",
  "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": "potx",
  "application/vnd.ms-powerpoint.presentation.macroEnabled.main+xml": "pptm",
  "application/vnd.ms-powerpoint.slideshow.macroEnabled.main+xml": "ppsm",
  "application/vnd.ms-powerpoint.template.macroEnabled.main+xml": "potm",
};

const CFB = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const startsWith = (b: Uint8Array, sig: number[]) => sig.every((v, i) => b[i] === v);

/** UTF-16LE search, used for directory entry names inside an OLE compound file. */
function hasUtf16(bytes: Uint8Array, text: string) {
  const needle = new Uint8Array(text.length * 2);
  for (let i = 0; i < text.length; i++) needle[i * 2] = text.charCodeAt(i);
  outer: for (let i = 0; i <= bytes.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (bytes[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
}

export function detectDeck(bytes: Uint8Array, fileName = ""): Detected {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (bytes.length === 0) return { ok: false, error: "empty" };

  if (startsWith(bytes, CFB)) {
    // A password-protected .pptx is an OLE file holding EncryptionInfo + EncryptedPackage.
    if (hasUtf16(bytes, "EncryptedPackage") || hasUtf16(bytes, "EncryptionInfo")) return { ok: false, error: "encrypted" };
    if (hasUtf16(bytes, "PowerPoint Document") || ext === "ppt" || ext === "pps" || ext === "pot") return { ok: false, error: "ppt" };
    if (hasUtf16(bytes, "WordDocument")) return { ok: false, error: "word" };
    if (hasUtf16(bytes, "Workbook")) return { ok: false, error: "excel" };
    return { ok: false, error: "unknown" };
  }
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) return { ok: false, error: "pdf" };
  if (!startsWith(bytes, [0x50, 0x4b])) return { ok: false, error: ext === "key" ? "key" : ext === "ppt" ? "corrupt" : "unknown" };

  const names: string[] = [];
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, {
      filter: (f) => {
        names.push(f.name);
        return f.name === "[Content_Types].xml" || f.name === "mimetype";
      },
    });
  } catch {
    return { ok: false, error: "corrupt" };
  }

  const mimetype = files.mimetype ? new TextDecoder().decode(files.mimetype).trim() : "";
  if (mimetype.startsWith("application/vnd.oasis.opendocument.presentation")) return { ok: false, error: "odp" };
  if (names.some((n) => n.startsWith("Index/") || n === "index.apxl" || n === "Index.zip") || ext === "key") return { ok: false, error: "key" };

  const ct = files["[Content_Types].xml"] ? new TextDecoder().decode(files["[Content_Types].xml"]) : "";
  if (!ct) return { ok: false, error: "corrupt" };
  for (const m of ct.matchAll(/ContentType\s*=\s*"([^"]+)"/g)) {
    const format = MAIN_TYPES[m[1]];
    if (format) {
      if (!names.includes("ppt/presentation.xml")) return { ok: false, error: "corrupt" };
      return { ok: true, format, macros: names.some((n) => n.toLowerCase().endsWith("vbaproject.bin")) };
    }
  }
  if (ct.includes("wordprocessingml")) return { ok: false, error: "word" };
  if (ct.includes("spreadsheetml")) return { ok: false, error: "excel" };
  return { ok: false, error: "unknown" };
}
