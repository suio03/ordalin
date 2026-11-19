import type { SheetModel } from "./model";

// Pixel geometry of one sheet: where every row and column starts.

export type Layout = {
  /** rowTop[r] is the y of row r; rowTop[rowCount] is the total height. Hidden rows have zero height. */
  rowTop: Float64Array;
  colLeft: Float64Array;
  hiddenRows: Set<number>;
  hiddenCols: Set<number>;
};

export function buildLayout(sheet: SheetModel, showHidden: boolean): Layout {
  const hiddenRows = new Set(sheet.hiddenRows);
  const hiddenCols = new Set(sheet.hiddenCols);
  const rowTop = new Float64Array(sheet.rowCount + 1);
  for (let r = 0; r < sheet.rowCount; r++) {
    const size = !showHidden && hiddenRows.has(r) ? 0 : (sheet.rowHeights[r] ?? sheet.defaultRowHeight);
    rowTop[r + 1] = rowTop[r] + size;
  }
  const colLeft = new Float64Array(sheet.colCount + 1);
  for (let c = 0; c < sheet.colCount; c++) {
    const size = !showHidden && hiddenCols.has(c) ? 0 : (sheet.colWidths[c] ?? sheet.defaultColWidth);
    colLeft[c + 1] = colLeft[c] + size;
  }
  return { rowTop, colLeft, hiddenRows, hiddenCols };
}

/** Index of the row or column that contains `offset` (clamped to the ends). */
export function indexAt(starts: Float64Array, offset: number): number {
  let lo = 0;
  let hi = starts.length - 2;
  if (hi < 0) return 0;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** The next index in `dir` whose size is not zero, or `from` when there is none. */
export function step(starts: Float64Array, from: number, dir: 1 | -1): number {
  const count = starts.length - 1;
  for (let i = from + dir; i >= 0 && i < count; i += dir) if (starts[i + 1] > starts[i]) return i;
  return from;
}
