import { detectBook, type DetectError } from "./detect";
import { fromCsv, fromHucre, fromSheetJS } from "./convert";
import type { Book } from "./model";

// bytes → Book, or the reason it can't be shown. Runs in the worker (and in tests).

export type OpenError = DetectError | "wrongPassword" | "encryptedLegacy" | "tooManyCells" | "failed";
export type OpenResult = { ok: true; book: Book } | { ok: false; error: OpenError; detail?: string };

export async function openBook(bytes: Uint8Array, fileName: string, password?: string): Promise<OpenResult> {
  const found = detectBook(bytes, fileName);
  const encrypted = !found.ok && found.error === "encrypted";
  if (!found.ok && !(encrypted && password)) return found;

  try {
    if (encrypted || (found.ok && (found.format === "xlsx" || found.format === "xlsm"))) {
      const hucre = await import("hucre");
      try {
        const wb = await hucre.readXlsx(bytes, { readStyles: true, dates: "serial", ...(password ? { password } : {}) });
        const format = found.ok ? found.format : /\.xlsm$/i.test(fileName) ? "xlsm" : "xlsx";
        return { ok: true, book: fromHucre(wb, hucre.resolveThemeColor, format, found.ok && found.macros, bytes) };
      } catch (e) {
        if (e instanceof hucre.DecryptionError) return { ok: false, error: "wrongPassword" };
        if (e instanceof hucre.EncryptedFileError) return { ok: false, error: "encrypted" };
        if (e instanceof hucre.ZipError) return { ok: false, error: "corrupt" };
        if (/MAX_TOTAL_CELLS|too many cells|cell limit/i.test(String((e as Error)?.message))) return { ok: false, error: "tooManyCells" };
        throw e;
      }
    }
    if (!found.ok) return found;
    if (found.format === "csv") return { ok: true, book: fromCsv(bytes, fileName) };

    const XLSX = await import("xlsx");
    try {
      const wb = XLSX.read(bytes, { dense: true, cellNF: true, cellFormula: true });
      return { ok: true, book: fromSheetJS(wb, found.format, found.macros) };
    } catch (e) {
      if (/password/i.test(String((e as Error)?.message))) return { ok: false, error: "encryptedLegacy" };
      throw e;
    }
  } catch (e) {
    return { ok: false, error: "failed", detail: e instanceof Error ? e.message : String(e) };
  }
}
