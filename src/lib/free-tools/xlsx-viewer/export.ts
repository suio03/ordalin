import { showCell } from "./display";
import { cellKey, type Book, type CellStyle, type SheetModel } from "./model";

// Current sheet → CSV text, and → a plain HTML table for the browser's print dialog.

export const PRINT_ROW_LIMIT = 5000;

type Options = { includeHidden: boolean };

function visible(sheet: SheetModel, { includeHidden }: Options) {
  const hiddenRows = new Set(includeHidden ? [] : sheet.hiddenRows);
  const hiddenCols = new Set(includeHidden ? [] : sheet.hiddenCols);
  const lastRow = sheet.rows.length;
  let lastCol = 0;
  for (const row of sheet.rows) if (row && row.length > lastCol) lastCol = row.length;
  const rows: number[] = [];
  for (let r = 0; r < lastRow; r++) if (!hiddenRows.has(r)) rows.push(r);
  const cols: number[] = [];
  for (let c = 0; c < lastCol; c++) if (!hiddenCols.has(c)) cols.push(c);
  return { rows, cols };
}

/** RFC 4180, CRLF line ends, the text each cell shows. */
export function sheetToCsv(book: Book, sheet: SheetModel, options: Options): string {
  const { rows, cols } = visible(sheet, options);
  const lines: string[] = [];
  for (const r of rows) {
    const fields: string[] = [];
    let last = -1;
    for (let i = 0; i < cols.length; i++) {
      const text = showCell(book, sheet, r, cols[i]).text;
      if (text !== "") last = i;
      fields.push(/[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text);
    }
    lines.push(fields.slice(0, last + 1).join(","));
  }
  return lines.join("\r\n");
}

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Only values our own converter produced go into style attributes. */
const SAFE_CSS = /^[#a-z0-9 .%-]+$/i;

function cellCss(style: CellStyle | undefined, kind: string, color?: string): string {
  const css: string[] = [];
  const align = style?.h ?? (kind === "number" ? "right" : kind === "center" ? "center" : "");
  if (align) css.push(`text-align:${align}`);
  if (style?.bold) css.push("font-weight:700");
  if (style?.italic) css.push("font-style:italic");
  if (style?.underline || style?.strike) css.push(`text-decoration:${[style.underline && "underline", style.strike && "line-through"].filter(Boolean).join(" ")}`);
  const fg = color ?? style?.color;
  if (fg && SAFE_CSS.test(fg)) css.push(`color:${fg}`);
  if (style?.bg && SAFE_CSS.test(style.bg)) css.push(`background:${style.bg}`);
  if (style?.size) css.push(`font-size:${style.size}pt`);
  for (const [key, side] of [["bt", "top"], ["br", "right"], ["bb", "bottom"], ["bl", "left"]] as const) {
    const border = style?.[key];
    if (border && SAFE_CSS.test(border)) css.push(`border-${side}:${border}`);
  }
  if (!style?.wrap) css.push("white-space:nowrap");
  return css.join(";");
}

/** A whole HTML document; `truncated` says rows past PRINT_ROW_LIMIT were left out. */
export function sheetToPrintHtml(book: Book, sheet: SheetModel, options: Options & { title: string }): { html: string; truncated: boolean } {
  const all = visible(sheet, options);
  const rows = all.rows.slice(0, PRINT_ROW_LIMIT);
  const { cols } = all;
  const rowAt = new Map(rows.map((r, i) => [r, i]));
  const colAt = new Map(cols.map((c, i) => [c, i]));

  // Merges become rowspan/colspan over the rows and columns that are printed.
  const span = new Map<number, [number, number]>();
  const covered = new Set<number>();
  for (const [r1, c1, r2, c2] of sheet.merges) {
    if (!rowAt.has(r1) || !colAt.has(c1)) continue;
    let rowSpan = 0;
    let colSpan = 0;
    for (let r = r1; r <= r2; r++) if (rowAt.has(r)) rowSpan++;
    for (let c = c1; c <= c2; c++) if (colAt.has(c)) colSpan++;
    span.set(cellKey(r1, c1), [rowSpan, colSpan]);
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) if (r !== r1 || c !== c1) covered.add(cellKey(r, c));
  }

  const body: string[] = [];
  for (const r of rows) {
    const cells: string[] = [];
    for (const c of cols) {
      const key = cellKey(r, c);
      if (covered.has(key)) continue;
      const shown = showCell(book, sheet, r, c);
      const merged = span.get(key);
      const attrs = (merged ? ` rowspan="${merged[0]}" colspan="${merged[1]}"` : "") + ` style="${cellCss(shown.style, shown.kind, shown.color)}"`;
      cells.push(`<td${attrs}>${escapeHtml(shown.text)}</td>`);
    }
    body.push(`<tr>${cells.join("")}</tr>`);
  }
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(options.title)}</title><style>
@page{margin:12mm}
body{margin:0;font:11pt Calibri,Carlito,Arial,sans-serif;color:#000;background:#fff}
table{border-collapse:collapse}
td{padding:1pt 3pt;border:0.5pt solid #d0d0d0;vertical-align:bottom;-webkit-print-color-adjust:exact;print-color-adjust:exact}
</style></head><body><table>${body.join("")}</table></body></html>`;
  return { html, truncated: all.rows.length > rows.length };
}
