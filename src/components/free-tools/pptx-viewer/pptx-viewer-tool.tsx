"use client";

// PPTX viewer: open a PowerPoint file in the browser, page through slides with
// thumbnails, read speaker notes, present full screen with PowerPoint keys and
// download slides as PNG or PDF. Nothing is uploaded.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { fmt } from "@/lib/free-tools/image-shape/copy";
import { pptxViewerCopy as t } from "@/lib/free-tools/pptx-viewer/copy";
import { slideRanges, type ReportRow } from "@/lib/free-tools/pptx-viewer/report";
import { showKey, startShow, type ShowState } from "@/lib/free-tools/pptx-viewer/slideshow";
import { closeDeck, download, exportPdf, exportPng, exportZip, openDeck, preloadRenderer, renderInto, type Deck } from "./engine";
import s from "./pptx-viewer.module.css";

const ACCEPT = ".pptx,.ppsx,.potx,.pptm,.ppsm,.potm,.ppt,.odp,.key,application/vnd.openxmlformats-officedocument.presentationml.presentation";
const ZOOMS = [1, 1.5, 2, 3];
const isTyping = (el: EventTarget | null) => el instanceof HTMLElement && !!el.closest("input, textarea, select, [contenteditable='true']");

export function PptxViewerTool({ name }: { name: string }) {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(0);
  const [notesOpen, setNotesOpen] = useState(true);
  const [showFrom, setShowFrom] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const deckRef = useRef<Deck | null>(null);
  const presentRef = useRef<HTMLButtonElement>(null);
  // Fullscreen has to be requested inside the click or key press itself.
  const present = (from: number) => {
    void document.documentElement.requestFullscreen?.().catch(() => {});
    setShowFrom(from);
  };

  useEffect(() => () => void (deckRef.current && closeDeck(deckRef.current)), []);

  const open = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setError(null);
    setLoading(file.name);
    const result = await openDeck(file);
    setLoading(null);
    if (!result.ok) {
      setError(fmt(t.errors[result.error], { name: file.name, detail: result.detail ?? "" }));
      return;
    }
    if (deckRef.current) closeDeck(deckRef.current);
    deckRef.current = result.deck;
    setDeck(result.deck);
    setIndex(0);
    setZoom(0);
    setNotesOpen(result.deck.hasNotes);
  }, []);

  const total = deck?.slides.length ?? 0;
  const go = useCallback((i: number) => setIndex(Math.max(0, Math.min(total - 1, i))), [total]);

  // Viewer keys (the slideshow has its own).
  useEffect(() => {
    if (!deck || showFrom !== null) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown") go(index + 1);
      else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp") go(index - 1);
      else if (k === "Home") go(0);
      else if (k === "End") go(total - 1);
      else if (k === "F5") present(e.shiftKey ? index : 0);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deck, showFrom, index, total, go]);

  const runExport = async (kind: "png" | "zip" | "pdf") => {
    if (!deck || busy) return;
    const progress = (n: number) => setBusy(fmt(t.exports.working, { n, total }));
    setBusy(fmt(t.exports.working, { n: kind === "png" ? index + 1 : 1, total }));
    setError(null);
    try {
      download(kind === "png" ? await exportPng(deck, index) : kind === "zip" ? await exportZip(deck, progress) : await exportPdf(deck, progress));
    } catch (e) {
      setError(fmt(t.exports.failed, { detail: e instanceof Error ? e.message : String(e) }));
    } finally {
      setBusy(null);
    }
  };

  if (!deck) {
    return (
      <section className={s.tool} id="tool" aria-label={name}>
        <Drop onFiles={open} loading={loading} />
        {error && (
          <p role="alert" className={s.error}>
            {error}
          </p>
        )}
      </section>
    );
  }

  const slide = deck.slides[index];
  return (
    <section className={s.tool} id="tool" aria-label={name}>
      <div className={s.bar}>
        <label className={s.openButton} title={t.toolbar.open}>
          <FilePicker onFiles={open} />
          <FolderIcon />
          <span className={s.fileName}>{deck.name}</span>
        </label>
        <div className={s.nav}>
          <button type="button" className={s.icon} onClick={() => go(index - 1)} disabled={index === 0} aria-label={t.toolbar.prev}>
            <ChevronIcon dir="left" />
          </button>
          <label className={s.counter}>
            <span className={s.srOnly}>{t.toolbar.jump}</span>
            <input
              key={index}
              type="number"
              inputMode="numeric"
              min={1}
              max={total}
              defaultValue={index + 1}
              onKeyDown={(e) => {
                if (e.key === "Enter") go(Number((e.target as HTMLInputElement).value) - 1);
              }}
              onBlur={(e) => go(Number(e.target.value) - 1)}
            />
            <span aria-hidden>/ {total}</span>
          </label>
          <button type="button" className={s.icon} onClick={() => go(index + 1)} disabled={index === total - 1} aria-label={t.toolbar.next}>
            <ChevronIcon dir="right" />
          </button>
        </div>
        <div className={s.nav}>
          <button type="button" className={s.icon} onClick={() => setZoom((z) => Math.max(0, z - 1))} disabled={zoom === 0} aria-label={t.toolbar.zoomOut}>
            <MinusIcon />
          </button>
          <button type="button" className={s.zoomLabel} onClick={() => setZoom(0)} aria-label={t.toolbar.fit}>
            {zoom === 0 ? t.toolbar.fit : `${ZOOMS[zoom] * 100}%`}
          </button>
          <button type="button" className={s.icon} onClick={() => setZoom((z) => Math.min(ZOOMS.length - 1, z + 1))} disabled={zoom === ZOOMS.length - 1} aria-label={t.toolbar.zoomIn}>
            <PlusIcon />
          </button>
        </div>
        <button type="button" className={s.toggle} aria-pressed={notesOpen} onClick={() => setNotesOpen((v) => !v)}>
          <NotesIcon />
          {t.toolbar.notes}
        </button>
        <button type="button" ref={presentRef} className={s.primary} onClick={() => present(index)}>
          <PresentIcon />
          {t.toolbar.present}
        </button>
      </div>

      {deck.macros && <p className={s.note}>{t.macros}</p>}

      <div className={s.body}>
        <Rail deck={deck} index={index} onPick={go} />
        <div className={s.main}>
          <Stage deck={deck} index={index} zoom={ZOOMS[zoom]} onSwipe={(d) => go(index + d)} />
          {slide.info.hidden && <p className={s.note}>{t.hiddenNote}</p>}
          {notesOpen && (
            <section className={s.notes} aria-label={t.notes.title}>
              <h2 className={s.panelTitle}>{t.notes.title}</h2>
              {slide.info.notes ? <p className={s.notesText}>{slide.info.notes}</p> : <p className={s.muted}>{t.notes.empty}</p>}
            </section>
          )}
          <div className={s.downloads}>
            <span className={s.panelTitle}>{t.exports.title}</span>
            <button type="button" className={s.secondary} disabled={!!busy} onClick={() => runExport("png")}>
              <DownloadIcon />
              {t.exports.png}
            </button>
            <button type="button" className={s.secondary} disabled={!!busy} onClick={() => runExport("zip")}>
              <DownloadIcon />
              {t.exports.zip}
            </button>
            <button type="button" className={s.secondary} disabled={!!busy} onClick={() => runExport("pdf")}>
              <DownloadIcon />
              {t.exports.pdf}
            </button>
            {busy && (
              <span className={s.muted} role="status">
                {busy}
              </span>
            )}
          </div>
          {error && (
            <p role="alert" className={s.error}>
              {error}
            </p>
          )}
        </div>
      </div>

      <Report rows={deck.report} />

      {showFrom !== null && (
        <Slideshow
          deck={deck}
          start={showFrom}
          onExit={(i) => {
            setShowFrom(null);
            setIndex(i);
            presentRef.current?.focus();
          }}
        />
      )}
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
      onPointerEnter={() => void preloadRenderer()}
      onFocus={() => void preloadRenderer()}
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

/** A slide rendered at its natural size and scaled to the frame's width. */
function SlideFrame({ deck, index, className, style }: { deck: Deck; index: number; className?: string; style?: React.CSSProperties }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / deck.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [deck.width]);

  useEffect(() => {
    const host = inner.current;
    if (!host) return;
    const handle = renderInto(deck, index, host);
    return () => {
      handle.dispose();
      host.replaceChildren();
    };
  }, [deck, index]);

  return (
    <div ref={outer} className={`${s.frame} ${className ?? ""}`} style={{ aspectRatio: `${deck.width} / ${deck.height}`, ...style }}>
      <div ref={inner} className={s.frameInner} style={{ width: deck.width, height: deck.height, transform: `scale(${scale})` }} />
    </div>
  );
}

function Stage({ deck, index, zoom, onSwipe }: { deck: Deck; index: number; zoom: number; onSwipe: (dir: 1 | -1) => void }) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return (
    <div
      className={s.stage}
      data-zoomed={zoom > 1}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse" && zoom === 1) start.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        const from = start.current;
        start.current = null;
        if (!from) return;
        const dx = e.clientX - from.x;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - from.y)) onSwipe(dx < 0 ? 1 : -1);
      }}
    >
      <SlideFrame deck={deck} index={index} style={{ width: `${zoom * 100}%` }} className={s.stageSlide} />
    </div>
  );
}

function Rail({ deck, index, onPick }: { deck: Deck; index: number; onPick: (i: number) => void }) {
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = list.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [index]);
  return (
    <ol ref={list} className={s.rail} aria-label={t.toolbar.slides}>
      {deck.slides.map((sl, i) => (
        <li key={sl.data.slidePath}>
          <button type="button" className={s.thumb} aria-current={i === index ? "true" : undefined} onClick={() => onPick(i)} aria-label={`${t.toolbar.jump} ${i + 1}${sl.info.hidden ? ` (${t.hidden})` : ""}`}>
            <span className={s.thumbNumber}>{i + 1}</span>
            <LazyThumb deck={deck} index={i} />
            {sl.info.hidden && <span className={s.badge}>{t.hidden}</span>}
          </button>
        </li>
      ))}
    </ol>
  );
}

function LazyThumb({ deck, index }: { deck: Deck; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return (
    <div ref={ref} className={s.thumbBox} style={{ aspectRatio: `${deck.width} / ${deck.height}` }}>
      {seen && <SlideFrame deck={deck} index={index} />}
    </div>
  );
}

function reportText(row: ReportRow): string {
  const i = row.issue;
  switch (i.kind) {
    case "media":
      return fmt(t.report.media[i.status], { media: i.media === "video" ? t.report.video : t.report.audio, ext: i.ext || "?" });
    case "image":
      return i.ext === "tiff" ? t.report.tiff : t.report.emf;
    case "fonts":
      return fmt(t.report.fonts, { fonts: i.fonts.join(", ") });
    default:
      return t.report[i.kind];
  }
}

function Report({ rows }: { rows: ReportRow[] }) {
  return (
    <details className={s.report} open={rows.length > 0}>
      <summary>
        {t.report.title} ({rows.length})
      </summary>
      {rows.length ? (
        <ul>
          {rows.map((row) => (
            <li key={JSON.stringify(row.issue)}>
              <span>{reportText(row)}</span>
              <span className={s.muted}>{row.slides === "deck" ? t.report.deck : fmt(t.report.slides, { list: slideRanges(row.slides) })}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={s.muted}>{t.report.none}</p>
      )}
    </details>
  );
}

function Slideshow({ deck, start, onExit }: { deck: Deck; start: number; onExit: (index: number) => void }) {
  const [state, setState] = useState<ShowState>(() => startShow(start, deck.slides.map((x) => x.info.hidden)));
  const ref = useRef<HTMLDivElement>(null);
  // Key handlers read the latest state without re-subscribing on every slide.
  const stateRef = useRef(state);
  const done = useRef(false);

  const leave = useCallback(() => {
    if (done.current) return;
    done.current = true;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    onExit(stateRef.current.index);
  }, [onExit]);

  const press = useCallback(
    (key: string) => {
      const r = showKey(stateRef.current, key, deck.slides.map((x) => x.info.hidden));
      if (!r) return false;
      if (r.exit) leave();
      else {
        stateRef.current = r.state;
        setState(r.state);
      }
      return true;
    },
    [deck, leave],
  );

  useEffect(() => {
    const el = ref.current;
    el?.focus();
    // Leaving fullscreen (Esc handled by the browser) ends the show.
    const onChange = () => {
      if (!document.fullscreenElement) leave();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (press(e.key)) e.preventDefault();
    };
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("keydown", onKey);
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = overflow;
    };
  }, [leave, press]);

  const startX = useRef<number | null>(null);
  return (
    <div
      ref={ref}
      className={s.show}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={t.toolbar.present}
      onPointerDown={(e) => (startX.current = e.clientX)}
      onPointerUp={(e) => {
        const from = startX.current;
        startX.current = null;
        if (from === null || (e.target as HTMLElement).closest("button")) return;
        const dx = e.clientX - from;
        if (Math.abs(dx) > 50) press(dx < 0 ? "ArrowRight" : "ArrowLeft");
        else press(e.clientX < window.innerWidth / 4 ? "ArrowLeft" : "ArrowRight");
      }}
    >
      {state.end ? (
        <p className={s.showEnd}>{t.show.end}</p>
      ) : (
        <SlideFrame deck={deck} index={state.index} className={s.showSlide} style={{ width: `min(100vw, calc(100dvh * ${deck.width / deck.height}))` }} />
      )}
      {state.blank && <div className={s.blank} data-blank={state.blank} />}
      <button type="button" className={s.showExit} onClick={leave}>
        {t.show.exit}
      </button>
      <p className={s.showHelp}>{t.show.help}</p>
    </div>
  );
}

/* ---------- Icons ---------- */

const iconProps = { "aria-hidden": true, viewBox: "0 0 24 24", width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Icon = ({ children }: { children: ReactNode }) => <svg {...iconProps}>{children}</svg>;
const ChevronIcon = ({ dir }: { dir: "left" | "right" }) => <Icon>{dir === "left" ? <path d="m15 6-6 6 6 6" /> : <path d="m9 6 6 6-6 6" />}</Icon>;
const PlusIcon = () => (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
const MinusIcon = () => (
  <Icon>
    <path d="M5 12h14" />
  </Icon>
);
const NotesIcon = () => (
  <Icon>
    <path d="M5 4h14v16H5z" />
    <path d="M8 9h8M8 13h8M8 17h5" />
  </Icon>
);
const PresentIcon = () => (
  <Icon>
    <path d="M3 4h18M4 4v11h16V4" />
    <path d="m12 15-3 5M12 15l3 5" />
    <path d="m10 8 4 2.5-4 2.5z" />
  </Icon>
);
const DownloadIcon = () => (
  <Icon>
    <path d="M12 4v11" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 20h14" />
  </Icon>
);
const FolderIcon = () => (
  <Icon>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </Icon>
);
