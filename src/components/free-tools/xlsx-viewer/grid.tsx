"use client";

// The sheet itself: a virtualized grid. Only the rows and columns in view are
// in the DOM, so a sheet with a million rows scrolls like a small one. Frozen
// rows and columns live in sticky bands; the browser does the scrolling.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { generalFit, showCell } from "@/lib/free-tools/xlsx-viewer/display";
import { indexAt, step, type Layout } from "@/lib/free-tools/xlsx-viewer/layout";
import { cellKey, colName, type Book, type CellStyle, type SheetModel } from "@/lib/free-tools/xlsx-viewer/model";
import s from "./xlsx-viewer.module.css";

const HEADER_HEIGHT = 22;
const BLOCK = 8;
const PX_PER_POINT = 96 / 72;
const DEFAULT_FONT_PX = 11 * PX_PER_POINT;
const SPILL_SCAN = 40;
/** Frozen panes wider or taller than this share of the view would leave nothing to scroll. */
const MAX_FROZEN_SHARE = 0.6;
const MAX_SCROLL_HEIGHT = 8_000_000;

export type Cell = { row: number; col: number };
type Range = { r0: number; r1: number; c0: number; c1: number };

type Props = {
  book: Book;
  sheet: SheetModel;
  layout: Layout;
  showHidden: boolean;
  images: string[];
  selected: Cell | null;
  /** Keys of cells on this sheet that match the search. */
  matches: Set<number>;
  /** Change `token` to scroll `selected` into view. */
  revealToken: number;
  label: string;
  chartLabel: string;
  onSelect: (cell: Cell) => void;
};

const fontStack = (name: string) => `"${name.replace(/["\\]/g, "")}", Calibri, Carlito, "Helvetica Neue", Arial, sans-serif`;

function styleCss(style: CellStyle): CSSProperties {
  const css: CSSProperties = {};
  if (style.font) css.fontFamily = fontStack(style.font);
  if (style.size) css.fontSize = style.size * PX_PER_POINT;
  if (style.bold) css.fontWeight = 700;
  if (style.italic) css.fontStyle = "italic";
  if (style.underline || style.strike) css.textDecoration = [style.underline && "underline", style.strike && "line-through"].filter(Boolean).join(" ");
  if (style.color) css.color = style.color;
  if (style.bg) {
    css.backgroundColor = style.bg;
    css.borderRightColor = style.bg;
    css.borderBottomColor = style.bg;
  }
  if (style.h) css.justifyContent = style.h === "left" ? "flex-start" : style.h === "right" ? "flex-end" : "center";
  if (style.v) css.alignItems = style.v === "top" ? "flex-start" : "center";
  if (style.indent) css[style.h === "right" ? "paddingRight" : "paddingLeft"] = 2 + style.indent * 9;
  if (style.bt) css.borderTop = style.bt;
  if (style.br) css.borderRight = style.br;
  if (style.bb) css.borderBottom = style.bb;
  if (style.bl) css.borderLeft = style.bl;
  if (style.bt || style.br || style.bb || style.bl) css.zIndex = 1;
  return css;
}

let ruler: CanvasRenderingContext2D | null = null;
const widths = new Map<string, number>();
function textWidth(text: string, font: string): number {
  const key = `${font}\n${text}`;
  let width = widths.get(key);
  if (width === undefined) {
    ruler ??= document.createElement("canvas").getContext("2d");
    if (!ruler) return 0;
    ruler.font = font;
    width = ruler.measureText(text).width;
    if (widths.size > 20000) widths.clear();
    widths.set(key, width);
  }
  return width;
}

export function Grid({ book, sheet, layout, showHidden, images, selected, matches, revealToken, label, chartLabel, onSelect }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ width: 960, height: 600 });
  const [range, setRange] = useState<Range>({ r0: 0, r1: 40, c0: 0, c1: 20 });
  const { rowTop, colLeft, hiddenRows, hiddenCols } = layout;
  const css = useMemo(() => book.styles.map(styleCss), [book.styles]);
  const bodyFont = useMemo(() => fontStack(book.font), [book.font]);

  const headerWidth = Math.max(40, String(sheet.rowCount).length * 8 + 16);
  const totalWidth = colLeft[sheet.colCount];
  const totalHeight = rowTop[sheet.rowCount];
  const frozenRows = rowTop[Math.min(sheet.freeze.rows, sheet.rowCount)] <= (view.height - HEADER_HEIGHT) * MAX_FROZEN_SHARE ? Math.min(sheet.freeze.rows, sheet.rowCount) : 0;
  const frozenCols = colLeft[Math.min(sheet.freeze.cols, sheet.colCount)] <= (view.width - headerWidth) * MAX_FROZEN_SHARE ? Math.min(sheet.freeze.cols, sheet.colCount) : 0;
  const frozenHeight = rowTop[frozenRows];
  const frozenWidth = colLeft[frozenCols];
  const cornerWidth = headerWidth + frozenWidth;
  const cornerHeight = HEADER_HEIGHT + frozenHeight;

  // Browsers cap an element's height (about 16.7 million px in Chrome), which a
  // full 1,048,576-row sheet exceeds. Past MAX_SCROLL_HEIGHT the scrollbar is
  // squeezed: each scrolled pixel moves the sheet by more than one, and `shift`
  // is how far the drawn rows are pulled back up to stay under the viewport.
  const realHeight = HEADER_HEIGHT + totalHeight;
  const sizerHeight = Math.min(realHeight, MAX_SCROLL_HEIGHT);
  const squeezed = realHeight > MAX_SCROLL_HEIGHT;
  const [shift, setShift] = useState(0);
  const contentTop = useCallback((el: HTMLElement) => (squeezed ? (el.scrollTop * (realHeight - el.clientHeight)) / (sizerHeight - el.clientHeight) : el.scrollTop), [squeezed, realHeight, sizerHeight]);

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const first = (starts: Float64Array, offset: number, frozen: number) => Math.max(frozen, Math.floor(indexAt(starts, offset) / BLOCK) * BLOCK - BLOCK);
    const last = (starts: Float64Array, offset: number, count: number) => Math.min(count - 1, Math.ceil((indexAt(starts, offset) + 1) / BLOCK) * BLOCK + BLOCK);
    const y = contentTop(el);
    setShift(Math.round(y - el.scrollTop));
    const next: Range = {
      r0: first(rowTop, y + frozenHeight, frozenRows),
      r1: last(rowTop, y + el.clientHeight - HEADER_HEIGHT, sheet.rowCount),
      c0: first(colLeft, el.scrollLeft + frozenWidth, frozenCols),
      c1: last(colLeft, el.scrollLeft + el.clientWidth - headerWidth, sheet.colCount),
    };
    setRange((old) => (old.r0 === next.r0 && old.r1 === next.r1 && old.c0 === next.c0 && old.c1 === next.c1 ? old : next));
    setView((old) => (old.width === el.clientWidth && old.height === el.clientHeight ? old : { width: el.clientWidth, height: el.clientHeight }));
  }, [rowTop, colLeft, frozenHeight, frozenRows, frozenWidth, frozenCols, headerWidth, sheet.rowCount, sheet.colCount, contentTop]);

  // A new sheet starts at its top-left corner.
  useLayoutEffect(() => {
    scroller.current?.scrollTo(0, 0);
  }, [sheet]);
  useLayoutEffect(measure, [measure]);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  /** The top-left cell of the merged range that holds this cell, and the range's far corner. */
  const mergeAt = useCallback(
    (row: number, col: number): [number, number, number, number] | null => {
      for (const m of sheet.merges) if (row >= m[0] && row <= m[2] && col >= m[1] && col <= m[3]) return m;
      return null;
    },
    [sheet.merges],
  );

  const reveal = useCallback(
    (cell: Cell) => {
      const el = scroller.current;
      if (!el) return;
      const m = mergeAt(cell.row, cell.col);
      const top = rowTop[cell.row];
      const bottom = rowTop[(m ? m[2] : cell.row) + 1];
      const left = colLeft[cell.col];
      const right = colLeft[(m ? m[3] : cell.col) + 1];
      let scrollTop = contentTop(el);
      let { scrollLeft } = el;
      if (cell.row >= frozenRows) {
        if (top < scrollTop + frozenHeight) scrollTop = top - frozenHeight;
        else if (bottom > scrollTop + el.clientHeight - HEADER_HEIGHT) scrollTop = Math.min(top - frozenHeight, bottom - el.clientHeight + HEADER_HEIGHT);
      }
      if (cell.col >= frozenCols) {
        if (left < scrollLeft + frozenWidth) scrollLeft = left - frozenWidth;
        else if (right > scrollLeft + el.clientWidth - headerWidth) scrollLeft = Math.min(left - frozenWidth, right - el.clientWidth + headerWidth);
      }
      // A squeezed scrollbar cannot land on an exact pixel, so leave the cell some room.
      if (squeezed) scrollTop = scrollTop === contentTop(el) ? el.scrollTop : ((top - frozenHeight - el.clientHeight / 3) * (sizerHeight - el.clientHeight)) / (realHeight - el.clientHeight);
      el.scrollTo(scrollLeft, Math.max(0, scrollTop));
    },
    [mergeAt, rowTop, colLeft, frozenRows, frozenCols, frozenHeight, frozenWidth, headerWidth, contentTop, squeezed, sizerHeight, realHeight],
  );

  const revealed = useRef(revealToken);
  useEffect(() => {
    if (revealed.current === revealToken) return;
    revealed.current = revealToken;
    if (selected) reveal(selected);
  }, [revealToken, selected, reveal]);

  const pick = (cell: Cell) => {
    const m = mergeAt(cell.row, cell.col);
    const target = m ? { row: m[0], col: m[1] } : cell;
    onSelect(target);
    return target;
  };

  const onClick = (e: React.MouseEvent) => {
    const el = scroller.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const x = e.clientX - box.left - headerWidth;
    const y = e.clientY - box.top - HEADER_HEIGHT;
    if (x < 0 || y < 0 || e.clientX > box.left + el.clientWidth || e.clientY > box.top + el.clientHeight) return;
    const contentX = x < frozenWidth ? x : x + el.scrollLeft;
    const contentY = y < frozenHeight ? y : y + contentTop(el);
    if (contentX >= totalWidth || contentY >= totalHeight) return;
    pick({ row: indexAt(rowTop, contentY), col: indexAt(colLeft, contentX) });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const from = selected ?? { row: 0, col: 0 };
    const m = mergeAt(from.row, from.col);
    const page = Math.max(1, Math.floor((view.height - cornerHeight) / sheet.defaultRowHeight) - 1);
    let to: Cell | null = null;
    if (e.key === "ArrowDown") to = { row: step(rowTop, m ? m[2] : from.row, 1), col: from.col };
    else if (e.key === "ArrowUp") to = { row: step(rowTop, from.row, -1), col: from.col };
    else if (e.key === "ArrowRight") to = { row: from.row, col: step(colLeft, m ? m[3] : from.col, 1) };
    else if (e.key === "ArrowLeft") to = { row: from.row, col: step(colLeft, from.col, -1) };
    else if (e.key === "PageDown") to = { row: Math.min(sheet.rowCount - 1, from.row + page), col: from.col };
    else if (e.key === "PageUp") to = { row: Math.max(0, from.row - page), col: from.col };
    else if (e.key === "Home") to = { row: from.row, col: 0 };
    if (!to) return;
    e.preventDefault();
    reveal(pick(to));
  };

  /** Everything drawn for one block of rows and columns; `dx`/`dy` place content pixels inside the pane. */
  const pane = (name: string, r0: number, r1: number, c0: number, c1: number, dx: number, dy: number): ReactNode[] => {
    const nodes: ReactNode[] = [];
    if (r1 < r0 || c1 < c0) return nodes;
    const left = colLeft[c0] + dx;
    const top = rowTop[r0] + dy;
    const width = colLeft[c1 + 1] - colLeft[c0];
    const height = rowTop[r1 + 1] - rowTop[r0];

    for (let r = r0; r <= r1; r++) if (rowTop[r + 1] > rowTop[r]) nodes.push(<i key={`h${r}`} className={s.lineH} style={{ left, top: rowTop[r + 1] + dy - 1, width }} />);
    for (let c = c0; c <= c1; c++) if (colLeft[c + 1] > colLeft[c]) nodes.push(<i key={`v${c}`} className={s.lineV} style={{ left: colLeft[c + 1] + dx - 1, top, height }} />);

    const covered = new Set<number>();
    const cell = (r: number, c: number, r2: number, c2: number) => {
      const w = colLeft[c2 + 1] - colLeft[c];
      const h = rowTop[r2 + 1] - rowTop[r];
      if (w <= 0 || h <= 0) return;
      const shown = showCell(book, sheet, r, c);
      const key = cellKey(r, c);
      const meta = sheet.meta.get(key);
      const base = meta?.s === undefined ? undefined : css[meta.s];
      const merged = r2 > r || c2 > c;
      const match = matches.has(key);
      if (shown.text === "" && !base?.backgroundColor && !base?.zIndex && !merged && !meta?.note) return;

      const style: CSSProperties = { ...base, left: colLeft[c] + dx - 1, top: rowTop[r] + dy - 1, width: w + 1, height: h + 1 };
      if (shown.color) style.color = shown.color;
      let text = shown.text;
      let spill: number | undefined;
      const wrap = shown.style?.wrap;
      if (shown.kind === "number") {
        const size = shown.style?.size ? shown.style.size * PX_PER_POINT : DEFAULT_FONT_PX;
        if (text.length * size * 0.56 > w - 6) {
          const font = `${shown.style?.italic ? "italic " : ""}${shown.style?.bold ? "700 " : ""}${size}px ${shown.style?.font ? fontStack(shown.style.font) : bodyFont}`;
          const fits = (candidate: string) => textWidth(candidate, font) <= w - 5;
          if (!fits(text)) text = (shown.general !== undefined && generalFit(shown.general, fits)) || "#".repeat(Math.max(1, Math.floor((w - 6) / (size * 0.56))));
        }
      } else if (shown.kind === "text" && !wrap && !merged && (!shown.style?.h || shown.style.h === "left")) {
        // Long text runs over the empty cells to its right, as in Excel.
        const row = sheet.rows[r] ?? [];
        let end = c + 1;
        while (end < sheet.colCount && end <= c + SPILL_SCAN && (row[end] === null || row[end] === undefined || row[end] === "") && !covered.has(cellKey(r, end))) end++;
        if (end > c + 1) spill = colLeft[end] - colLeft[c] - 5;
      }
      nodes.push(
        <div key={`${r},${c}`} className={s.cell} data-kind={shown.kind} data-wrap={wrap || undefined} data-spill={spill ? true : undefined} data-match={match || undefined} data-note={meta?.note ? true : undefined} style={style} title={text !== shown.text ? shown.text : meta?.note}>
          <span style={spill ? { maxWidth: spill } : undefined}>{text}</span>
        </div>,
      );
    };

    const anchors: [number, number, number, number][] = [];
    for (const m of sheet.merges) {
      if (m[2] < r0 || m[0] > r1 || m[3] < c0 || m[1] > c1) continue;
      anchors.push(m);
      for (let r = Math.max(m[0], r0); r <= Math.min(m[2], r1); r++) for (let c = Math.max(m[1], c0); c <= Math.min(m[3], c1); c++) covered.add(cellKey(r, c));
    }
    for (let r = r0; r <= r1; r++) {
      const row = sheet.rows[r];
      if (rowTop[r + 1] === rowTop[r]) continue;
      // Styled cells can sit past the last value of a row, so walk the whole window.
      for (let c = c0; c <= c1; c++) {
        if (covered.has(cellKey(r, c))) continue;
        if ((row === undefined || row[c] === null || row[c] === undefined || row[c] === "") && !sheet.meta.has(cellKey(r, c))) continue;
        cell(r, c, r, c);
      }
    }
    for (const m of anchors) cell(m[0], m[1], m[2], m[3]);

    const inPane = (x: number, y: number, w: number, h: number) => x < colLeft[c1 + 1] && x + w > colLeft[c0] && y < rowTop[r1 + 1] && y + h > rowTop[r0];
    sheet.images.forEach((img, i) => {
      const x = colLeft[Math.min(img.col, sheet.colCount)] + img.dx;
      const y = rowTop[Math.min(img.row, sheet.rowCount)] + img.dy;
      // eslint-disable-next-line @next/next/no-img-element -- a blob URL of a picture inside the user's file
      if (images[i] && inPane(x, y, img.width, img.height)) nodes.push(<img key={`img${i}`} className={s.picture} src={images[i]} alt={img.alt} draggable={false} style={{ left: x + dx, top: y + dy, width: img.width, height: img.height }} />);
    });
    sheet.charts.forEach((chart, i) => {
      const x = colLeft[Math.min(chart.col, sheet.colCount)];
      const y = rowTop[Math.min(chart.row, sheet.rowCount)];
      if (!inPane(x, y, chart.width, chart.height)) return;
      nodes.push(
        <div key={`chart${i}`} className={s.chart} style={{ left: x + dx, top: y + dy, width: chart.width, height: chart.height }}>
          <strong>{chart.title || chart.kind}</strong>
          <span>{chartLabel}</span>
        </div>,
      );
    });

    if (selected && selected.row >= r0 && selected.row <= r1 && selected.col >= c0 && selected.col <= c1) {
      const m = mergeAt(selected.row, selected.col);
      const w = colLeft[(m ? m[3] : selected.col) + 1] - colLeft[selected.col];
      const h = rowTop[(m ? m[2] : selected.row) + 1] - rowTop[selected.row];
      if (w > 0 && h > 0) nodes.push(<i key={`sel-${name}`} className={s.selection} style={{ left: colLeft[selected.col] + dx - 1, top: rowTop[selected.row] + dy - 1, width: w + 1, height: h + 1 }} />);
    }
    return nodes;
  };

  const colHeaders = (c0: number, c1: number): ReactNode[] => {
    const nodes: ReactNode[] = [];
    for (let c = c0; c <= c1; c++) {
      const w = colLeft[c + 1] - colLeft[c];
      if (w <= 0) continue;
      const gap = !showHidden && (hiddenCols.has(c + 1) || hiddenCols.has(c - 1));
      nodes.push(
        <b key={`ch${c}`} className={s.head} data-active={selected?.col === c || undefined} data-gap={gap ? (hiddenCols.has(c + 1) ? "end" : "start") : undefined} data-revealed={(showHidden && hiddenCols.has(c)) || undefined} style={{ left: headerWidth + colLeft[c], top: 0, width: w, height: HEADER_HEIGHT }}>
          {colName(c)}
        </b>,
      );
    }
    return nodes;
  };
  const rowHeaders = (r0: number, r1: number, dy: number): ReactNode[] => {
    const nodes: ReactNode[] = [];
    for (let r = r0; r <= r1; r++) {
      const h = rowTop[r + 1] - rowTop[r];
      if (h <= 0) continue;
      const gap = !showHidden && (hiddenRows.has(r + 1) || hiddenRows.has(r - 1));
      nodes.push(
        <b key={`rh${r}`} className={s.head} data-active={selected?.row === r || undefined} data-gap={gap ? (hiddenRows.has(r + 1) ? "bottom" : "top") : undefined} data-revealed={(showHidden && hiddenRows.has(r)) || undefined} style={{ left: 0, top: rowTop[r] + dy, width: headerWidth, height: h }}>
          {r + 1}
        </b>,
      );
    }
    return nodes;
  };

  const { r0, c0 } = range;
  const r1 = Math.min(range.r1, sheet.rowCount - 1);
  const c1 = Math.min(range.c1, sheet.colCount - 1);
  const width = headerWidth + totalWidth;

  return (
    <div ref={scroller} className={s.grid} style={{ fontFamily: bodyFont }} tabIndex={0} role="region" aria-label={label} onScroll={measure} onClick={onClick} onKeyDown={onKeyDown}>
      <div className={s.sizer} style={{ width, height: sizerHeight }}>
        <div className={s.corner} style={{ width: cornerWidth, height: cornerHeight }} data-frozen-rows={frozenRows > 0 || undefined} data-frozen-cols={frozenCols > 0 || undefined}>
          {pane("corner", 0, frozenRows - 1, 0, frozenCols - 1, headerWidth, HEADER_HEIGHT)}
          {colHeaders(0, frozenCols - 1)}
          {rowHeaders(0, frozenRows - 1, HEADER_HEIGHT)}
          <b className={s.head} style={{ left: 0, top: 0, width: headerWidth, height: HEADER_HEIGHT }} />
        </div>
        <div className={s.top} style={{ width, height: cornerHeight, marginTop: -cornerHeight }} data-frozen={frozenRows > 0 || undefined}>
          {pane("top", 0, frozenRows - 1, c0, c1, headerWidth, HEADER_HEIGHT)}
          {colHeaders(c0, c1)}
        </div>
        <div className={s.left} style={{ width: cornerWidth, height: sizerHeight - cornerHeight }} data-frozen={frozenCols > 0 || undefined}>
          {pane("left", r0, r1, 0, frozenCols - 1, headerWidth, -frozenHeight - shift)}
          {rowHeaders(r0, r1, -frozenHeight - shift)}
        </div>
        {pane("main", r0, r1, c0, c1, headerWidth, HEADER_HEIGHT - shift)}
      </div>
    </div>
  );
}
