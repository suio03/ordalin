import { showCell } from "./display";
import type { Book } from "./model";

// Find in every sheet, against the text each cell shows. Works in slices so a
// workbook with millions of cells never blocks typing.

export type Hit = { sheet: number; row: number; col: number };
export const HIT_LIMIT = 2000;
const SLICE_MS = 24;

export async function findAll(book: Book, query: string, cancelled: () => boolean): Promise<{ hits: Hit[]; capped: boolean } | null> {
  const needle = query.trim().toLowerCase();
  const hits: Hit[] = [];
  if (!needle) return { hits, capped: false };
  let sliceStart = performance.now();
  for (let s = 0; s < book.sheets.length; s++) {
    const sheet = book.sheets[s];
    for (let r = 0; r < sheet.rows.length; r++) {
      const row = sheet.rows[r];
      if (!row) continue;
      for (let c = 0; c < row.length; c++) {
        const value = row[c];
        if (value === null || value === "") continue;
        const text = typeof value === "string" ? value : showCell(book, sheet, r, c).text;
        if (!text.toLowerCase().includes(needle)) continue;
        hits.push({ sheet: s, row: r, col: c });
        if (hits.length >= HIT_LIMIT) return { hits, capped: true };
      }
      if ((r & 255) === 255 && performance.now() - sliceStart > SLICE_MS) {
        await new Promise((resolve) => setTimeout(resolve, 0));
        if (cancelled()) return null;
        sliceStart = performance.now();
      }
    }
  }
  return cancelled() ? null : { hits, capped: false };
}
