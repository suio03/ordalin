import { formatValue } from "hucre";
import { cellKey, type Book, type CellStyle, type SheetModel } from "./model";

// What a cell shows. Numbers are formatted on demand (only visible, searched
// or exported cells), so opening a large sheet does not format every cell.

/** Excel's General format: up to 11 significant digits, exponent beyond that. */
export function general(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (Number.isInteger(n) && Math.abs(n) < 1e11) return String(n);
  const abs = Math.abs(n);
  if (abs >= 1e11 || abs < 1e-9) {
    const [m, e] = n.toExponential(5).split("e");
    return `${Number(m)}E${Number(e) < 0 ? "-" : "+"}${String(Math.abs(Number(e))).padStart(2, "0")}`;
  }
  return String(Number(n.toPrecision(11)));
}

/**
 * A General number that is too wide for its column: Excel drops decimals,
 * then switches to scientific notation, before it falls back to ####.
 */
export function generalFit(n: number, fits: (text: string) => boolean): string | null {
  const whole = Math.round(n).toString().replace("-", "").length;
  for (let digits = Math.min(10, 11 - whole); digits >= 0; digits--) {
    const text = String(Number(n.toFixed(digits)));
    if (fits(text)) return text;
  }
  for (let digits = 5; digits >= 0; digits--) {
    const [m, e] = n.toExponential(digits).split("e");
    const text = `${Number(m)}E${Number(e) < 0 ? "-" : "+"}${String(Math.abs(Number(e))).padStart(2, "0")}`;
    if (fits(text)) return text;
  }
  return null;
}

export const ERROR_VALUE = /^#(DIV\/0!|N\/A|NAME\?|NULL!|NUM!|REF!|VALUE!|SPILL!|CALC!|GETTING_DATA)$/;

const SECTION_COLORS: Record<string, string> = { red: "#ff0000", blue: "#0000ff", green: "#008000", magenta: "#ff00ff", cyan: "#00ffff", yellow: "#ffff00", white: "#ffffff", black: "#000000" };

/** The colour a number format asks for, e.g. `0.00;[Red]-0.00` on a negative value. */
export function formatColor(nf: string, n: number): string | undefined {
  if (!nf.includes("[")) return undefined;
  const sections = nf.split(";");
  const section = sections.length === 1 ? sections[0] : n > 0 ? sections[0] : n < 0 ? sections[1] : (sections[2] ?? sections[0]);
  const name = section?.match(/\[(red|blue|green|magenta|cyan|yellow|white|black)\]/i)?.[1];
  return name ? SECTION_COLORS[name.toLowerCase()] : undefined;
}

export type Shown = { text: string; kind: "text" | "number" | "center"; style?: CellStyle; color?: string; /** Set for General-format numbers, which may be shortened to fit. */ general?: number };

export function showCell(book: Book, sheet: SheetModel, row: number, col: number): Shown {
  const raw = sheet.rows[row]?.[col] ?? null;
  const meta = sheet.meta.get(cellKey(row, col));
  const style = meta?.s === undefined ? undefined : book.styles[meta.s];
  if (raw === null || raw === "") return { text: "", kind: "text", style };
  if (typeof raw === "boolean") return { text: raw ? "TRUE" : "FALSE", kind: "center", style };
  if (typeof raw === "string") return { text: raw, kind: ERROR_VALUE.test(raw) ? "center" : "text", style };
  if (meta?.t !== undefined) return { text: meta.t, kind: "number", style };
  const nf = style?.nf;
  if (!nf || nf === "General") return { text: general(raw), kind: "number", style, general: raw };
  let text: string;
  try {
    text = formatValue(raw, nf, { is1904: book.date1904 });
  } catch {
    text = general(raw);
  }
  return { text, kind: nf === "@" ? "text" : "number", style, color: formatColor(nf, raw) };
}

/** Text for search, CSV and print: the same string the grid shows. */
export const cellText = (book: Book, sheet: SheetModel, row: number, col: number) => showCell(book, sheet, row, col).text;
