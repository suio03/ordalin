// The workbook as the viewer draws it. Built in the worker, structured-cloned
// to the page, so everything here is plain data.

export type Scalar = string | number | boolean | null;

export type BookFormat = "xlsx" | "xlsm" | "xlsb" | "xls" | "ods" | "csv";

/** CSS-ready cell style, shared by index between cells. */
export type CellStyle = {
  font?: string;
  /** Points. */
  size?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  bg?: string;
  h?: "left" | "center" | "right";
  v?: "top" | "middle";
  wrap?: boolean;
  indent?: number;
  /** CSS border shorthands, e.g. "2px solid #c00000". */
  bt?: string;
  br?: string;
  bb?: string;
  bl?: string;
  /** Excel number format code; absent means General. */
  nf?: string;
};

export type CellMeta = {
  /** Index into Book.styles. */
  s?: number;
  /** Display text when the reader already formatted the value. */
  t?: string;
  /** Formula text without the leading "=". */
  f?: string;
  note?: string;
  link?: string;
};

export type SheetImage = { bytes: Uint8Array; mime: string; row: number; col: number; dx: number; dy: number; width: number; height: number; alt: string };
export type SheetChart = { title: string; kind: string; row: number; col: number; width: number; height: number };

export type SheetStats = { cells: number; formulas: number; notes: number; links: number };

export type SheetModel = {
  name: string;
  hidden: boolean;
  rows: Scalar[][];
  /** Keyed by cellKey(row, col). Only cells that carry more than a value. */
  meta: Map<number, CellMeta>;
  rowCount: number;
  colCount: number;
  /** Pixels, by column index; missing entries use defaultColWidth. */
  colWidths: Record<number, number>;
  /** Pixels, by row index; missing entries use defaultRowHeight. */
  rowHeights: Record<number, number>;
  defaultColWidth: number;
  defaultRowHeight: number;
  hiddenRows: number[];
  hiddenCols: number[];
  /** [row1, col1, row2, col2], inclusive. */
  merges: [number, number, number, number][];
  freeze: { rows: number; cols: number };
  images: SheetImage[];
  charts: SheetChart[];
  /** A1-style used range, or "" for an empty sheet. */
  used: string;
  stats: SheetStats;
};

export type IssueKind =
  | "charts"
  | "conditional"
  | "sparklines"
  | "shapes"
  | "slicers"
  | "richText"
  | "rotation"
  | "gradient"
  | "embedded"
  | "pictures"
  | "basicStyles";

/** Something in the file that the viewer does not draw. `sheets` is empty for whole-file issues. */
export type Issue = { kind: IssueKind; sheets: string[] };

export type Book = {
  format: BookFormat;
  macros: boolean;
  date1904: boolean;
  /** Body font of the workbook, CSS family name. */
  font: string;
  styles: CellStyle[];
  sheets: SheetModel[];
  issues: Issue[];
};

export const MAX_COLS = 16384;
export const cellKey = (row: number, col: number) => row * MAX_COLS + col;

export function colName(col: number): string {
  let name = "";
  for (let n = col + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
}

export const cellName = (row: number, col: number) => `${colName(col)}${row + 1}`;

/** Runs of consecutive indexes: [3,4,5,9] → [[3,5],[9,9]]. */
export function runs(sorted: number[]): [number, number][] {
  const out: [number, number][] = [];
  for (const n of sorted) {
    const last = out[out.length - 1];
    if (last && n === last[1] + 1) last[1] = n;
    else out.push([n, n]);
  }
  return out;
}
