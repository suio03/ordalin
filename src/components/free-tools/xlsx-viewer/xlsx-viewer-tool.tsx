"use client";

// XLSX viewer: open a spreadsheet in the browser as a read-only grid with its
// formatting, sheet tabs, hidden items, formulas and saved results. Parsing
// runs in a worker; nothing is uploaded.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { fmt } from "@/lib/free-tools/image-shape/copy";
import { xlsxViewerCopy as t, type Plural } from "@/lib/free-tools/xlsx-viewer/copy";
import { general, showCell } from "@/lib/free-tools/xlsx-viewer/display";
import { PRINT_ROW_LIMIT, sheetToCsv, sheetToPrintHtml } from "@/lib/free-tools/xlsx-viewer/export";
import { findAll, type Hit } from "@/lib/free-tools/xlsx-viewer/find";
import { buildLayout } from "@/lib/free-tools/xlsx-viewer/layout";
import { cellKey, cellName, type Book, type SheetModel } from "@/lib/free-tools/xlsx-viewer/model";
import type { OpenResult } from "@/lib/free-tools/xlsx-viewer/open";
import type { WorkerReply, WorkerRequest } from "@/lib/free-tools/xlsx-viewer/worker";
import { Grid, type Cell } from "./grid";
import s from "./xlsx-viewer.module.css";

const ACCEPT = ".xlsx,.xlsm,.xltx,.xltm,.xlsb,.xls,.ods,.csv,.tsv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv";
/** Largest file opened in testing; see docs/keywords/xlsx-viewer.md. */
export const MAX_FILE_BYTES = 100 * 1024 * 1024;
const FIND_DELAY_MS = 200;

type Opened = { book: Book; name: string; images: string[][] };

const plural = (p: Plural, n: number) => fmt(n === 1 ? p.one : p.other, { n: n.toLocaleString("en-US") });
const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;

async function parse(file: File, password?: string): Promise<OpenResult> {
  const request = async (): Promise<WorkerRequest> => ({ id: 1, bytes: await file.arrayBuffer(), name: file.name, password });
  try {
    const worker = new Worker(new URL("../../../lib/free-tools/xlsx-viewer/worker.ts", import.meta.url), { type: "module" });
    try {
      const message = await request();
      return await new Promise<OpenResult>((resolve, reject) => {
        worker.onmessage = (e: MessageEvent<WorkerReply>) => resolve(e.data.result);
        worker.onerror = (e) => reject(new Error(e.message));
        worker.postMessage(message, [message.bytes]);
      });
    } finally {
      worker.terminate();
    }
  } catch {
    // No worker (old browser, blocked script): read the file on the page instead.
    const { openBook } = await import("@/lib/free-tools/xlsx-viewer/open");
    return openBook(new Uint8Array(await file.arrayBuffer()), file.name, password);
  }
}

export function XlsxViewerTool({ name }: { name: string }) {
  const [opened, setOpened] = useState<Opened | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState<File | null>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [selected, setSelected] = useState<Cell | null>(null);
  const [revealToken, setRevealToken] = useState(0);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{ hits: Hit[]; capped: boolean } | null>(null);
  const [hitIndex, setHitIndex] = useState(-1);
  const [printNote, setPrintNote] = useState(false);
  const urls = useRef<string[]>([]);

  const release = () => {
    urls.current.forEach((url) => URL.revokeObjectURL(url));
    urls.current = [];
  };
  useEffect(() => release, []);

  const open = useCallback(async (file: File, password?: string) => {
    setError(null);
    if (file.size > MAX_FILE_BYTES) {
      setError(fmt(t.errors.tooBig, { name: file.name, size: megabytes(file.size), limit: megabytes(MAX_FILE_BYTES) }));
      return;
    }
    setLoading(file.name);
    const result = await parse(file, password).catch((e): OpenResult => ({ ok: false, error: "failed", detail: e instanceof Error ? e.message : String(e) }));
    setLoading(null);
    if (!result.ok) {
      const needsPassword = result.error === "encrypted" || result.error === "wrongPassword";
      setLocked(needsPassword ? file : null);
      setError(fmt(t.errors[result.error], { name: file.name, detail: result.detail ?? "" }));
      return;
    }
    release();
    const images = result.book.sheets.map((sheet) =>
      sheet.images.map((img) => {
        const url = URL.createObjectURL(new Blob([img.bytes as BlobPart], { type: img.mime }));
        urls.current.push(url);
        return url;
      }),
    );
    setLocked(null);
    setOpened({ book: result.book, name: file.name, images });
    setSheetIndex(Math.max(0, result.book.sheets.findIndex((sheet) => !sheet.hidden)));
    setSelected(null);
    setShowHidden(false);
    setQuery("");
    setFound(null);
    setHitIndex(-1);
    setPrintNote(false);
  }, []);
  const onFiles = useCallback((files: File[]) => void open(files[0]), [open]);

  const book = opened?.book;
  const sheet = book?.sheets[sheetIndex];
  const layout = useMemo(() => (sheet ? buildLayout(sheet, showHidden) : null), [sheet, showHidden]);

  // Search as the user types, after a short pause.
  useEffect(() => {
    if (!book || !query.trim()) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await findAll(book, query, () => cancelled);
      if (!result) return;
      setFound(result);
      setHitIndex(-1);
    }, FIND_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [book, query]);
  const hits = query.trim() ? found : null;

  const matches = useMemo(() => {
    const set = new Set<number>();
    for (const hit of hits?.hits ?? []) if (hit.sheet === sheetIndex) set.add(cellKey(hit.row, hit.col));
    return set;
  }, [hits, sheetIndex]);

  const goToHit = (direction: 1 | -1) => {
    if (!book || !hits?.hits.length) return;
    const count = hits.hits.length;
    const next = hitIndex < 0 ? (direction === 1 ? 0 : count - 1) : (hitIndex + direction + count) % count;
    const hit = hits.hits[next];
    const target = book.sheets[hit.sheet];
    // A match on a hidden row or column is only reachable with hidden items shown.
    if (target.hiddenRows.includes(hit.row) || target.hiddenCols.includes(hit.col)) setShowHidden(true);
    setHitIndex(next);
    setSheetIndex(hit.sheet);
    setSelected({ row: hit.row, col: hit.col });
    setRevealToken((n) => n + 1);
  };

  if (!opened || !book || !sheet || !layout) {
    return (
      <section className={s.tool} id="tool" aria-label={name}>
        <Drop onFiles={onFiles} loading={loading} />
        {error && (
          <p role="alert" className={s.error}>
            {error}
          </p>
        )}
        {locked && !loading && <PasswordForm onSubmit={(password) => void open(locked, password)} />}
      </section>
    );
  }

  const hiddenCount = sheet.hiddenRows.length + sheet.hiddenCols.length;
  const baseName = opened.name.replace(/\.[^.]+$/, "");

  const downloadCsv = () => {
    const blob = new Blob(["﻿", sheetToCsv(book, sheet, { includeHidden: showHidden })], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${baseName}-${sheet.name.replace(/[\\/:*?"<>|]/g, "_")}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
  };

  const print = () => {
    const { html, truncated } = sheetToPrintHtml(book, sheet, { includeHidden: showHidden, title: `${baseName} - ${sheet.name}` });
    setPrintNote(truncated);
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.className = s.printFrame;
    frame.srcdoc = html;
    frame.onload = () => {
      const view = frame.contentWindow;
      if (!view) return;
      view.onafterprint = () => frame.remove();
      view.focus();
      view.print();
    };
    document.body.appendChild(frame);
  };

  return (
    <section className={s.tool} id="tool" aria-label={name}>
      <div className={s.bar}>
        <label className={s.openButton} title={t.toolbar.open}>
          <FilePicker onFiles={onFiles} />
          <FolderIcon />
          <span className={s.fileName}>{loading ? fmt(t.loading, { name: loading }) : opened.name}</span>
        </label>
        <form
          className={s.find}
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            goToHit(1);
          }}
        >
          <label className={s.findField}>
            <span className={s.srOnly}>{t.toolbar.find}</span>
            <SearchIcon />
            <input
              type="search"
              value={query}
              placeholder={t.toolbar.findPlaceholder}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.shiftKey) {
                  e.preventDefault();
                  goToHit(-1);
                }
              }}
            />
          </label>
          {query.trim() && (
            <span className={s.findCount} role="status">
              {!hits ? t.toolbar.searching : hits.hits.length === 0 ? t.toolbar.noMatches : fmt(hits.capped ? t.toolbar.matchesCapped : t.toolbar.matches, { n: hitIndex < 0 ? "–" : hitIndex + 1, total: hits.hits.length.toLocaleString("en-US") })}
            </span>
          )}
          <button type="button" className={s.icon} onClick={() => goToHit(-1)} disabled={!hits?.hits.length} aria-label={t.toolbar.prev}>
            <ChevronIcon dir="up" />
          </button>
          <button type="submit" className={s.icon} disabled={!hits?.hits.length} aria-label={t.toolbar.next}>
            <ChevronIcon dir="down" />
          </button>
        </form>
        <div className={s.actions}>
          <button type="button" className={s.secondary} onClick={downloadCsv}>
            <DownloadIcon />
            {t.toolbar.csv}
          </button>
          <button type="button" className={s.secondary} onClick={print}>
            <PrintIcon />
            {t.toolbar.print}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className={s.error}>
          {error}
        </p>
      )}
      {locked && !loading && <PasswordForm onSubmit={(password) => void open(locked, password)} />}
      {book.macros && <p className={s.note}>{t.macros}</p>}
      {book.issues.some((issue) => issue.kind === "basicStyles") && <p className={s.note}>{fmt(t.basic, { format: book.format })}</p>}
      {printNote && <p className={s.note}>{fmt(t.printTruncated, { n: PRINT_ROW_LIMIT.toLocaleString("en-US") })}</p>}

      <FormulaBar book={book} sheet={sheet} selected={selected} />

      <Grid
        book={book}
        sheet={sheet}
        layout={layout}
        showHidden={showHidden}
        images={opened.images[sheetIndex] ?? []}
        selected={selected}
        matches={matches}
        revealToken={revealToken}
        label={fmt(t.grid, { name: sheet.name })}
        chartLabel={t.chart}
        onSelect={setSelected}
      />

      <div className={s.below}>
        <div className={s.tabs} role="tablist" aria-label={t.sheets}>
          {book.sheets.map((item, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              className={s.tab}
              aria-selected={i === sheetIndex}
              data-hidden={item.hidden || undefined}
              onClick={() => {
                setSheetIndex(i);
                setSelected(null);
              }}
            >
              {item.name}
              {item.hidden && <span className={s.badge}>{t.hidden}</span>}
            </button>
          ))}
        </div>
        {hiddenCount > 0 && (
          <button type="button" className={s.toggle} aria-pressed={showHidden} onClick={() => setShowHidden((v) => !v)}>
            {fmt(t.toolbar.showHidden, { n: hiddenCount })}
          </button>
        )}
      </div>

      <Overview book={book} />
      <Report book={book} />
    </section>
  );
}

/* ---------- Pieces ---------- */

function FilePicker({ onFiles }: { onFiles: (files: File[]) => void }) {
  return (
    <input
      type="file"
      accept={ACCEPT}
      onChange={(e) => {
        const files = [...(e.target.files ?? [])];
        e.target.value = "";
        if (files.length) onFiles(files);
      }}
    />
  );
}

function Drop({ onFiles, loading }: { onFiles: (files: File[]) => void; loading: string | null }) {
  const [over, setOver] = useState(false);
  return (
    <label
      className={s.drop}
      data-over={over}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const files = [...(e.dataTransfer?.files ?? [])];
        if (files.length) onFiles(files);
      }}
    >
      <FilePicker onFiles={onFiles} />
      {loading ? (
        <strong role="status">{fmt(t.loading, { name: loading })}</strong>
      ) : (
        <>
          <strong>{t.drop.title}</strong>
          <span className={s.dropAction}>{t.drop.action}</span>
          <small>{t.drop.formats}</small>
        </>
      )}
    </label>
  );
}

function PasswordForm({ onSubmit }: { onSubmit: (password: string) => void }) {
  const [password, setPassword] = useState("");
  return (
    <form
      className={s.password}
      onSubmit={(e) => {
        e.preventDefault();
        if (password) onSubmit(password);
      }}
    >
      <label>
        <span>{t.password.label}</span>
        <input type="password" value={password} autoComplete="off" data-1p-ignore data-lpignore="true" autoFocus onChange={(e) => setPassword(e.target.value)} />
      </label>
      <button type="submit" className={s.primary} disabled={!password}>
        {t.password.open}
      </button>
      <p className={s.muted}>{t.password.note}</p>
    </form>
  );
}

const SAFE_LINK = /^(https?:|mailto:)/i;

function FormulaBar({ book, sheet, selected }: { book: Book; sheet: SheetModel; selected: Cell | null }) {
  if (!selected) {
    return (
      <div className={s.formula} aria-label={t.formulaBar.label}>
        <span className={s.muted}>{t.formulaBar.empty}</span>
      </div>
    );
  }
  const { row, col } = selected;
  const meta = sheet.meta.get(cellKey(row, col));
  const raw = sheet.rows[row]?.[col] ?? null;
  const shown = showCell(book, sheet, row, col).text;
  const stored = typeof raw === "number" ? general(raw) : null;
  const extras: ReactNode[] = [];
  if (meta?.f) extras.push(<span key="result">{fmt(t.formulaBar.result, { value: shown === "" ? "–" : shown })}</span>);
  else if (stored !== null && stored !== shown) extras.push(<span key="stored">{fmt(t.formulaBar.stored, { value: stored })}</span>);
  if (meta?.link)
    extras.push(
      <span key="link">
        {t.formulaBar.link}
        {SAFE_LINK.test(meta.link) ? (
          <a href={meta.link} target="_blank" rel="noopener noreferrer nofollow">
            {meta.link}
          </a>
        ) : (
          meta.link
        )}
      </span>,
    );
  if (meta?.note) extras.push(<span key="note">{fmt(t.formulaBar.note, { text: meta.note })}</span>);
  return (
    <div className={s.formula} aria-label={t.formulaBar.label} aria-live="polite">
      <b className={s.address}>{cellName(row, col)}</b>
      <code className={s.formulaText}>{meta?.f ? `=${meta.f}` : shown}</code>
      {extras.length > 0 && <div className={s.formulaExtras}>{extras}</div>}
    </div>
  );
}

function Overview({ book }: { book: Book }) {
  const cells = book.sheets.reduce((sum, sheet) => sum + sheet.stats.cells, 0);
  const o = t.overview;
  return (
    <details className={s.report} open>
      <summary>{o.title}</summary>
      <p className={s.muted}>{fmt(o.file, { format: t.formats[book.format], sheets: plural(o.sheetCount, book.sheets.length), cells: cells.toLocaleString("en-US") })}</p>
      <ul>
        {book.sheets.map((sheet, i) => {
          const facts = [
            sheet.used || o.empty,
            sheet.hidden && o.hiddenSheet,
            sheet.stats.formulas > 0 && plural(o.formulas, sheet.stats.formulas),
            sheet.images.length > 0 && plural(o.pictures, sheet.images.length),
            sheet.charts.length > 0 && plural(o.charts, sheet.charts.length),
            sheet.stats.notes > 0 && plural(o.notes, sheet.stats.notes),
            sheet.stats.links > 0 && plural(o.links, sheet.stats.links),
            sheet.merges.length > 0 && plural(o.merges, sheet.merges.length),
            sheet.hiddenRows.length > 0 && plural(o.hiddenRows, sheet.hiddenRows.length),
            sheet.hiddenCols.length > 0 && plural(o.hiddenCols, sheet.hiddenCols.length),
            (sheet.freeze.rows > 0 || sheet.freeze.cols > 0) && o.frozen,
          ].filter(Boolean);
          return (
            <li key={i}>
              <span>{sheet.name}</span>
              <span className={s.muted}>{facts.join(" · ")}</span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function Report({ book }: { book: Book }) {
  const r = t.report;
  return (
    <details className={s.report} open={book.issues.length > 0}>
      <summary>
        {r.title} ({book.issues.length})
      </summary>
      {book.issues.length > 0 ? (
        <ul>
          {book.issues.map((issue) => (
            <li key={issue.kind}>
              <span>{r.kinds[issue.kind]}</span>
              <span className={s.muted}>{issue.sheets.length ? issue.sheets.join(", ") : r.wholeFile}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={s.muted}>{r.none}</p>
      )}
      <p className={s.muted}>{r.always}</p>
    </details>
  );
}

/* ---------- Icons ---------- */

const iconProps = { "aria-hidden": true, viewBox: "0 0 24 24", width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Icon = ({ children }: { children: ReactNode }) => <svg {...iconProps}>{children}</svg>;
const ChevronIcon = ({ dir }: { dir: "up" | "down" }) => <Icon>{dir === "up" ? <path d="m6 15 6-6 6 6" /> : <path d="m6 9 6 6 6-6" />}</Icon>;
const SearchIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-4.5-4.5" />
  </Icon>
);
const DownloadIcon = () => (
  <Icon>
    <path d="M12 4v11" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 20h14" />
  </Icon>
);
const PrintIcon = () => (
  <Icon>
    <path d="M7 9V4h10v5" />
    <rect x="4" y="9" width="16" height="8" rx="2" />
    <path d="M7 14h10v6H7z" />
  </Icon>
);
const FolderIcon = () => (
  <Icon>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </Icon>
);
