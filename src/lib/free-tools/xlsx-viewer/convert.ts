import { unzipSync } from "fflate";
import { cellKey, cellName, type Book, type BookFormat, type CellMeta, type CellStyle, type Issue, type IssueKind, type Scalar, type SheetModel } from "./model";
import { general } from "./display";

// Reader output → Book. Runs in the worker.
//   .xlsx / .xlsm        hucre: values, styles, pictures, saved formula results
//   .xlsb / .xls / .ods  SheetJS: values, formats, formulas, sizes (no fonts or borders)
//   .csv                 parsed here; every field stays text

type Hucre = typeof import("hucre");
type HWorkbook = Awaited<ReturnType<Hucre["readXlsx"]>>;
type HSheet = HWorkbook["sheets"][number];
type HStyle = NonNullable<NonNullable<HSheet["cells"]> extends Map<string, infer C> ? (C extends { style?: infer S } ? S : never) : never>;
type HColor = { rgb?: string; theme?: number; tint?: number; indexed?: number };

const PX_PER_CHAR = 7;
const PX_PER_POINT = 96 / 72;
const EMU_PER_PX = 9525;
export const DEFAULT_COL_PX = 64;
export const DEFAULT_ROW_PX = 20;
const DEFAULT_FONT_PT = 11;

// Excel's legacy 56-colour palette (indexes 8–63; 0–7 repeat 8–15).
const INDEXED =
  "000000 ffffff ff0000 00ff00 0000ff ffff00 ff00ff 00ffff 800000 008000 000080 808000 800080 008080 c0c0c0 808080 9999ff 993366 ffffcc ccffff 660066 ff8080 0066cc ccccff 000080 ff00ff ffff00 00ffff 800080 800000 008080 0000ff 00ccff ccffff ccffcc ffff99 99ccff ff99cc cc99ff ffcc99 3366ff 33cccc 99cc00 ffcc00 ff9900 ff6600 666699 969696 003366 339966 003300 333300 993300 993366 333399 333333".split(
    " ",
  );

const BORDER_CSS: Record<string, string> = {
  thin: "1px solid",
  hair: "1px dotted",
  dotted: "1px dotted",
  dashed: "1px dashed",
  dashDot: "1px dashed",
  dashDotDot: "1px dashed",
  medium: "2px solid",
  mediumDashed: "2px dashed",
  mediumDashDot: "2px dashed",
  mediumDashDotDot: "2px dashed",
  slantDashDot: "2px dashed",
  thick: "3px solid",
  double: "3px double",
};

const MIME: Record<string, string> = { png: "image/png", jpeg: "image/jpeg", gif: "image/gif", svg: "image/svg+xml", webp: "image/webp" };

function usedRange(rows: Scalar[][]): { used: string; cols: number; cells: number } {
  let minR = -1;
  let maxR = -1;
  let minC = Infinity;
  let maxC = -1;
  let cells = 0;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      const v = row[c];
      if (v === null || v === undefined || v === "") continue;
      cells++;
      if (minR < 0) minR = r;
      maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    }
  }
  if (maxR < 0) return { used: "", cols: 0, cells: 0 };
  return { used: minR === maxR && minC === maxC ? cellName(minR, minC) : `${cellName(minR, minC)}:${cellName(maxR, maxC)}`, cols: maxC + 1, cells };
}

function emptySheet(name: string, rows: Scalar[][]): SheetModel {
  const { used, cols, cells } = usedRange(rows);
  return {
    name,
    hidden: false,
    rows,
    meta: new Map(),
    rowCount: rows.length,
    colCount: cols,
    colWidths: {},
    rowHeights: {},
    defaultColWidth: DEFAULT_COL_PX,
    defaultRowHeight: DEFAULT_ROW_PX,
    hiddenRows: [],
    hiddenCols: [],
    merges: [],
    freeze: { rows: 0, cols: 0 },
    images: [],
    charts: [],
    used,
    stats: { cells, formulas: 0, notes: 0, links: 0 },
  };
}

/** Grow the grid so merges, pictures and sized columns past the last value still show. */
function fit(sheet: SheetModel) {
  for (const [, , r2, c2] of sheet.merges) {
    sheet.rowCount = Math.max(sheet.rowCount, r2 + 1);
    sheet.colCount = Math.max(sheet.colCount, c2 + 1);
  }
  for (const a of [...sheet.images, ...sheet.charts]) {
    sheet.rowCount = Math.max(sheet.rowCount, a.row + Math.ceil(a.height / sheet.defaultRowHeight) + 1);
    sheet.colCount = Math.max(sheet.colCount, a.col + Math.ceil(a.width / sheet.defaultColWidth) + 1);
  }
  sheet.rowCount = Math.max(sheet.rowCount, 30);
  sheet.colCount = Math.max(sheet.colCount, 12);
}

class IssueLog {
  private map = new Map<IssueKind, Set<string>>();
  add(kind: IssueKind, sheet?: string) {
    const set = this.map.get(kind) ?? new Set<string>();
    if (sheet) set.add(sheet);
    this.map.set(kind, set);
  }
  list(): Issue[] {
    return [...this.map].map(([kind, sheets]) => ({ kind, sheets: [...sheets] }));
  }
}

/* ---------- .xlsx / .xlsm ---------- */

export function fromHucre(wb: HWorkbook, resolveTheme: Hucre["resolveThemeColor"], format: BookFormat, macros: boolean, bytes: Uint8Array): Book {
  // Theme XML lists dark 1, light 1, dark 2, light 2; cell colours index them light first.
  const t = wb.themeColors ?? [];
  const theme = t.length >= 4 ? [t[1], t[0], t[3], t[2], ...t.slice(4)] : t;
  const issues = new IssueLog();

  const css = (c?: HColor): string | undefined => {
    if (!c) return undefined;
    if (c.rgb) return `#${(c.rgb.length === 8 ? c.rgb.slice(2) : c.rgb).toLowerCase()}`;
    if (c.theme !== undefined && theme.length) return `#${resolveTheme(theme, c.theme, c.tint).toLowerCase()}`;
    if (c.indexed !== undefined && c.indexed < 64) return `#${INDEXED[c.indexed < 8 ? c.indexed : c.indexed - 8]}`;
    return undefined;
  };

  const styles: CellStyle[] = [];
  const byObject = new WeakMap<object, number>();
  const byJson = new Map<string, number>();
  const flags = new WeakMap<object, { rotation: boolean; gradient: boolean }>();

  const styleIndex = (hs: HStyle, sheet: string): number | undefined => {
    let index = byObject.get(hs);
    if (index === undefined) {
      const out: CellStyle = {};
      const { font, fill, border, alignment, numFmt } = hs;
      if (font) {
        if (font.name && font.name !== wb.defaultFont?.name) out.font = font.name;
        if (font.size && font.size !== DEFAULT_FONT_PT) out.size = font.size;
        if (font.bold) out.bold = true;
        if (font.italic) out.italic = true;
        if (font.underline) out.underline = true;
        if (font.strikethrough) out.strike = true;
        const color = css(font.color);
        if (color && color !== "#000000") out.color = color;
      }
      let gradient = false;
      if (fill?.type === "pattern" && fill.pattern !== "none") {
        // Solid fills keep their colour in fgColor; hatch patterns are drawn as their background.
        const bg = css(fill.pattern === "solid" ? (fill.fgColor ?? fill.bgColor) : (fill.bgColor ?? fill.fgColor));
        if (bg) out.bg = bg;
      } else if (fill?.type === "gradient") {
        gradient = true;
        const bg = css(fill.stops[0]?.color);
        if (bg) out.bg = bg;
      }
      if (border) {
        for (const [side, key] of [["top", "bt"], ["right", "br"], ["bottom", "bb"], ["left", "bl"]] as const) {
          const b = border[side];
          if (b?.style) out[key] = `${BORDER_CSS[b.style] ?? "1px solid"} ${css(b.color) ?? "#000000"}`;
        }
      }
      if (alignment) {
        const h = alignment.horizontal;
        if (h === "left" || h === "right") out.h = h;
        else if (h === "center" || h === "centerContinuous" || h === "distributed") out.h = "center";
        if (alignment.vertical === "top") out.v = "top";
        else if (alignment.vertical === "center" || alignment.vertical === "distributed" || alignment.vertical === "justify") out.v = "middle";
        if (alignment.wrapText) out.wrap = true;
        if (alignment.indent) out.indent = alignment.indent;
      }
      if (numFmt && numFmt !== "General") out.nf = numFmt;
      flags.set(hs, { rotation: !!alignment?.textRotation, gradient });

      if (Object.keys(out).length === 0) index = -1;
      else {
        const json = JSON.stringify(out);
        index = byJson.get(json);
        if (index === undefined) {
          index = styles.push(out) - 1;
          byJson.set(json, index);
        }
      }
      byObject.set(hs, index);
    }
    const f = flags.get(hs);
    if (f?.rotation) issues.add("rotation", sheet);
    if (f?.gradient) issues.add("gradient", sheet);
    return index < 0 ? undefined : index;
  };

  const sheets = wb.sheets.map((hs) => {
    const sheet = emptySheet(hs.name, hs.rows as Scalar[][]);
    sheet.hidden = !!(hs.hidden || hs.veryHidden);
    if (hs.defaultColWidth) sheet.defaultColWidth = Math.round(hs.defaultColWidth * PX_PER_CHAR);
    if (hs.defaultRowHeight) sheet.defaultRowHeight = Math.round(hs.defaultRowHeight * PX_PER_POINT);

    // Rows without a stored height grow with their largest font, as Excel does on open.
    const tallest = new Map<number, number>();
    for (const [key, cell] of hs.cells ?? []) {
      const comma = key.indexOf(",");
      const row = Number(key.slice(0, comma));
      const col = Number(key.slice(comma + 1));
      const meta: CellMeta = {};
      if (cell.style) {
        const s = styleIndex(cell.style, hs.name);
        if (s !== undefined) {
          meta.s = s;
          const size = styles[s].size;
          if (size && size > DEFAULT_FONT_PT && size > (tallest.get(row) ?? 0)) tallest.set(row, size);
        }
      }
      if (cell.formula) {
        meta.f = cell.formula;
        sheet.stats.formulas++;
      }
      if (cell.comment?.text) {
        meta.note = cell.comment.author ? `${cell.comment.author}: ${cell.comment.text}` : cell.comment.text;
        sheet.stats.notes++;
      }
      const link = cell.hyperlink?.target ?? (cell.hyperlink?.location ? `#${cell.hyperlink.location}` : undefined);
      if (link) {
        meta.link = link;
        sheet.stats.links++;
      }
      if (cell.richText && cell.richText.length > 1) issues.add("richText", hs.name);
      if (meta.s !== undefined || meta.f || meta.note || meta.link) sheet.meta.set(cellKey(row, col), meta);
      // Styled cells past the last value still belong to the drawn grid.
      if (meta.s !== undefined && styles[meta.s].bg) {
        sheet.rowCount = Math.max(sheet.rowCount, row + 1);
        sheet.colCount = Math.max(sheet.colCount, col + 1);
      }
    }

    hs.columns?.forEach((col, i) => {
      if (col.width) sheet.colWidths[i] = Math.round(col.width * PX_PER_CHAR);
      if (col.hidden) sheet.hiddenCols.push(i);
    });
    for (const [row, def] of hs.rowDefs ?? []) {
      if (def.height) sheet.rowHeights[row] = Math.round(def.height * PX_PER_POINT);
      if (def.hidden) sheet.hiddenRows.push(row);
    }
    sheet.hiddenRows.sort((a, b) => a - b);
    for (const [row, size] of tallest) {
      if (sheet.rowHeights[row] === undefined) sheet.rowHeights[row] = Math.ceil(size * PX_PER_POINT * 1.3) + 2;
    }

    sheet.merges = (hs.merges ?? []).map((m) => [m.startRow, m.startCol, m.endRow, m.endCol]);
    sheet.freeze = { rows: hs.freezePane?.rows ?? 0, cols: hs.freezePane?.columns ?? 0 };

    const widthOf = (c: number) => sheet.colWidths[c] ?? sheet.defaultColWidth;
    const heightOf = (r: number) => sheet.rowHeights[r] ?? sheet.defaultRowHeight;
    type Anchor = { from: { row: number; col: number; colOff?: number; rowOff?: number }; to?: { row: number; col: number; colOff?: number; rowOff?: number } };
    const box = (anchor: Anchor, width?: number, height?: number, fallback = { width: 480, height: 288 }) => {
      const { from, to } = anchor;
      const dx = (from.colOff ?? 0) / EMU_PER_PX;
      const dy = (from.rowOff ?? 0) / EMU_PER_PX;
      if ((!width || !height) && to) {
        let w = (to.colOff ?? 0) / EMU_PER_PX - dx;
        for (let c = from.col; c < to.col; c++) w += widthOf(c);
        let h = (to.rowOff ?? 0) / EMU_PER_PX - dy;
        for (let r = from.row; r < to.row; r++) h += heightOf(r);
        if (w > 0 && h > 0) return { row: from.row, col: from.col, dx, dy, width: Math.round(w), height: Math.round(h) };
      }
      return { row: from.row, col: from.col, dx, dy, width: width || fallback.width, height: height || fallback.height };
    };

    for (const img of hs.images ?? []) {
      sheet.images.push({ ...box(img.anchor, img.width, img.height, { width: 160, height: 120 }), bytes: img.data, mime: MIME[img.type] ?? "image/png", alt: img.altText ?? img.title ?? "" });
    }
    for (const chart of hs.charts ?? []) {
      const b = box((chart as { anchor?: Anchor }).anchor ?? { from: { row: 0, col: 0 } });
      sheet.charts.push({ title: chart.title ?? "", kind: chart.kinds?.[0] ?? "", row: b.row, col: b.col, width: b.width, height: b.height });
    }
    if (sheet.charts.length) issues.add("charts", hs.name);
    if (hs.conditionalRules?.length) issues.add("conditional", hs.name);
    if (hs.sparklines?.length) issues.add("sparklines", hs.name);
    if (hs.textBoxes?.length) issues.add("shapes", hs.name);
    if (hs.slicers?.length || hs.timelines?.length) issues.add("slicers", hs.name);
    fit(sheet);
    return sheet;
  });

  // Parts no reader model covers are found by name in the package.
  try {
    let shapes = false;
    let embedded = false;
    const drawings = unzipSync(bytes, {
      filter: (f) => {
        if (/^xl\/embeddings\//.test(f.name)) embedded = true;
        return /^xl\/drawings\/drawing\d+\.xml$/.test(f.name) && f.originalSize < 5_000_000;
      },
    });
    for (const xml of Object.values(drawings)) if (/<xdr:(sp|cxnSp|grpSp)[ >]/.test(new TextDecoder().decode(xml))) shapes = true;
    if (shapes) issues.add("shapes");
    if (embedded) issues.add("embedded");
  } catch {
    // The workbook itself parsed; a failed scan only means these two notes are missing.
  }

  const font = wb.defaultFont?.name ?? "Calibri";
  return { format, macros, date1904: wb.dateSystem === "1904", font, styles, sheets, issues: issues.list() };
}

/* ---------- .xlsb / .xls / .ods ---------- */

type SheetJS = typeof import("xlsx");
type XWorkbook = ReturnType<SheetJS["read"]>;

export function fromSheetJS(wb: XWorkbook, format: BookFormat, macros: boolean): Book {
  const styles: CellStyle[] = [];
  const sheets = wb.SheetNames.map((name, index) => {
    const ws = wb.Sheets[name] ?? {};
    type XCell = { t: string; v?: unknown; w?: string; f?: string; c?: { a?: string; t?: string }[]; l?: { Target?: string } };
    const data = ((ws as { "!data"?: (XCell | undefined)[][] })["!data"] ?? []) as (XCell | undefined)[][];
    const rows: Scalar[][] = [];
    const meta = new Map<number, CellMeta>();
    let formulas = 0;
    let notes = 0;
    let links = 0;
    for (let r = 0; r < data.length; r++) {
      const src = data[r];
      if (!src) {
        rows.push([]);
        continue;
      }
      const row: Scalar[] = new Array(src.length).fill(null);
      for (let c = 0; c < src.length; c++) {
        const cell = src[c];
        if (!cell) continue;
        const m: CellMeta = {};
        if (cell.t === "n" && typeof cell.v === "number") {
          row[c] = cell.v;
          if (cell.w !== undefined && cell.w !== general(cell.v)) m.t = cell.w;
        } else if (cell.t === "b") row[c] = !!cell.v;
        else if (cell.t === "e") row[c] = cell.w ?? "#N/A";
        else if (cell.t === "d" && cell.v instanceof Date) row[c] = cell.w ?? cell.v.toISOString();
        else if (cell.t !== "z" && cell.v !== undefined) row[c] = String(cell.v);
        if (cell.f) {
          m.f = cell.f;
          formulas++;
        }
        const note = cell.c?.map((x) => (x.a ? `${x.a}: ${x.t ?? ""}` : (x.t ?? ""))).join("\n");
        if (note) {
          m.note = note;
          notes++;
        }
        if (cell.l?.Target) {
          m.link = cell.l.Target;
          links++;
        }
        if (m.t !== undefined || m.f || m.note || m.link) meta.set(cellKey(r, c), m);
      }
      rows.push(row);
    }
    const sheet = emptySheet(name, rows);
    sheet.meta = meta;
    sheet.stats = { ...sheet.stats, formulas, notes, links };
    sheet.hidden = !!wb.Workbook?.Sheets?.[index]?.Hidden;
    (ws["!cols"] ?? []).forEach((col, i) => {
      if (!col) return;
      if (col.wpx) sheet.colWidths[i] = Math.round(col.wpx);
      else if (col.wch) sheet.colWidths[i] = Math.round(col.wch * PX_PER_CHAR + 5);
      if (col.hidden) sheet.hiddenCols.push(i);
    });
    (ws["!rows"] ?? []).forEach((row, i) => {
      if (!row) return;
      if (row.hpx) sheet.rowHeights[i] = Math.round(row.hpx);
      else if (row.hpt) sheet.rowHeights[i] = Math.round(row.hpt * PX_PER_POINT);
      if (row.hidden) sheet.hiddenRows.push(i);
    });
    sheet.merges = (ws["!merges"] ?? []).map((m) => [m.s.r, m.s.c, m.e.r, m.e.c]);
    fit(sheet);
    return sheet;
  });
  return { format, macros, date1904: !!wb.Workbook?.WBProps?.date1904, font: "Calibri", styles, sheets, issues: [{ kind: "basicStyles", sheets: [] }, { kind: "pictures", sheets: [] }] };
}

/* ---------- .csv ---------- */

export function decodeText(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(bytes.subarray(2));
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(bytes.subarray(2));
  return new TextDecoder("utf-8").decode(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? bytes.subarray(3) : bytes);
}

/** RFC 4180 with the delimiter picked from the first line (comma, semicolon or tab). */
export function parseDelimited(text: string): string[][] {
  const firstLine = text.slice(0, text.search(/\r|\n|$/));
  const count = (ch: string) => firstLine.split(ch).length - 1;
  const delimiter = count("\t") > count(",") && count("\t") >= count(";") ? "\t" : count(";") > count(",") ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch !== '"') field += ch;
      else if (text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = false;
    } else if (ch === '"' && field === "") quoted = true;
    else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function fromCsv(bytes: Uint8Array, name: string): Book {
  const rows: Scalar[][] = parseDelimited(decodeText(bytes));
  const sheet = emptySheet(name.replace(/\.[^.]+$/, "") || "Sheet1", rows);
  fit(sheet);
  return { format: "csv", macros: false, date1904: false, font: "Calibri", styles: [], sheets: [sheet], issues: [] };
}
