import { unzipSync } from "fflate";
import type { BookFormat } from "./model";

// What the file really is, read from its bytes. The extension is only a hint:
// renamed files and password-protected workbooks are common.

export type DetectError = "empty" | "encrypted" | "corrupt" | "word" | "powerpoint" | "pdf" | "unknown";
export type Detected = { ok: true; format: BookFormat; macros: boolean } | { ok: false; error: DetectError };

const CFB = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

const startsWith = (bytes: Uint8Array, sig: number[]) => sig.every((b, i) => bytes[i] === b);

/** Stream names inside an OLE container are UTF-16LE. */
function hasUtf16(bytes: Uint8Array, text: string): boolean {
  const first = text.charCodeAt(0);
  outer: for (let i = 0; i + text.length * 2 <= bytes.length; i++) {
    if (bytes[i] !== first || bytes[i + 1] !== 0) continue;
    for (let j = 1; j < text.length; j++) {
      if (bytes[i + j * 2] !== text.charCodeAt(j) || bytes[i + j * 2 + 1] !== 0) continue outer;
    }
    return true;
  }
  return false;
}

function looksLikeText(bytes: Uint8Array): boolean {
  const n = Math.min(bytes.length, 4096);
  for (let i = 0; i < n; i++) if (bytes[i] === 0) return false;
  return true;
}

export function detectBook(bytes: Uint8Array, fileName: string): Detected {
  if (bytes.length === 0) return { ok: false, error: "empty" };
  const ext = fileName.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";

  if (startsWith(bytes, CFB)) {
    // A password-protected .xlsx is an OLE container wrapping the encrypted package.
    if (hasUtf16(bytes, "EncryptedPackage")) return { ok: false, error: "encrypted" };
    if (hasUtf16(bytes, "Workbook") || hasUtf16(bytes, "Book")) return { ok: true, format: "xls", macros: hasUtf16(bytes, "_VBA_PROJECT") };
    if (hasUtf16(bytes, "WordDocument")) return { ok: false, error: "word" };
    if (hasUtf16(bytes, "PowerPoint Document")) return { ok: false, error: "powerpoint" };
    return { ok: false, error: "unknown" };
  }
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) return { ok: false, error: "pdf" };

  if (startsWith(bytes, [0x50, 0x4b])) {
    let files: Record<string, Uint8Array>;
    try {
      files = unzipSync(bytes, { filter: (f) => f.name === "[Content_Types].xml" || f.name === "mimetype" });
    } catch {
      return { ok: false, error: "corrupt" };
    }
    const decode = (b?: Uint8Array) => (b ? new TextDecoder().decode(b) : "");
    const mime = decode(files.mimetype).trim();
    if (mime) return mime.startsWith("application/vnd.oasis.opendocument.spreadsheet") ? { ok: true, format: "ods", macros: false } : { ok: false, error: mime.includes("opendocument.text") ? "word" : mime.includes("opendocument.presentation") ? "powerpoint" : "unknown" };
    const types = decode(files["[Content_Types].xml"]);
    if (!types) return { ok: false, error: "unknown" };
    const macros = types.includes("vbaProject");
    if (types.includes("sheet.binary")) return { ok: true, format: "xlsb", macros };
    if (/spreadsheetml\.(sheet|template)\.main|ms-excel\.(sheet|template)\.macroEnabled\.main/.test(types)) return { ok: true, format: /macroEnabled\.main/.test(types) ? "xlsm" : "xlsx", macros };
    if (types.includes("wordprocessingml") || types.includes("ms-word")) return { ok: false, error: "word" };
    if (types.includes("presentationml") || types.includes("ms-powerpoint")) return { ok: false, error: "powerpoint" };
    return { ok: false, error: "unknown" };
  }

  if ((ext === "csv" || ext === "tsv" || ext === "txt") && looksLikeText(bytes)) return { ok: true, format: "csv", macros: false };
  // A spreadsheet extension on bytes that are none of the above: damaged or mislabelled.
  return { ok: false, error: /^(xlsx|xlsm|xlsb|xls|ods)$/.test(ext) ? "corrupt" : "unknown" };
}
