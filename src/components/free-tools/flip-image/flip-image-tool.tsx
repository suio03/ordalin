"use client";

// Flip and rotate images in the browser. JPGs are flipped losslessly in a
// worker (coefficient transform, like jpegtran); PNG and WebP are redrawn on a
// canvas at full size. Nothing is uploaded.
import { zipSync } from "fflate";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type DragEvent } from "react";
import { trackEvent } from "@/lib/analytics";
import { en, type FlipCopy } from "@/lib/free-tools/flip-image/copy";
import {
  canvasTransform,
  compose,
  FLIP_H,
  FLIP_V,
  IDENTITY,
  isIdentity,
  orientName,
  outputSize,
  ROTATE_CCW,
  ROTATE_CW,
  type Orient,
} from "@/lib/free-tools/flip-image/orient";
import type { FlipReply } from "@/lib/free-tools/flip-image/worker";
import { fmt } from "@/lib/free-tools/image-shape/copy";
import { ACCEPTED_TYPES, LIMITS } from "@/lib/free-tools/image-shape/geometry";
import { baseName, saveBlob } from "@/lib/free-tools/image-shape/render";
import shape from "../image-shape/image-shape.module.css";
import styles from "./flip-image.module.css";

const MAX_FILES = 10;
const PREVIEW_SIDE = 1024;
const JPEG_QUALITY = 0.95;

type Kind = "jpeg" | "png" | "webp";
type Item = { id: number; name: string; file: File; kind: Kind; img: HTMLImageElement; url: string; width: number; height: number; preview: HTMLCanvasElement };
type Lossless = { ok: true; bytes: ArrayBuffer; width: number; height: number; trimmed: { x: number; y: number } } | { ok: false };
type Output = { blob: Blob; name: string };

const KIND: Record<string, Kind> = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" };
const EXT: Record<Kind, string> = { jpeg: "jpg", png: "png", webp: "webp" };
const key = (o: Orient) => o.join(",");
const noSubscribe = () => () => {};
let webpSupport: boolean | undefined;
/** Safari can't encode WebP: toDataURL then falls back to PNG. */
function canEncodeWebp() {
  if (webpSupport === undefined) {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    webpSupport = c.toDataURL("image/webp").startsWith("data:image/webp");
  }
  return webpSupport;
}

function loadImage(file: File) {
  return new Promise<{ img: HTMLImageElement; url: string }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };
    img.src = url;
  });
}

/** A small copy of the image for previews, so flipping stays instant on large photos. */
function previewOf(img: HTMLImageElement) {
  const k = Math.min(1, PREVIEW_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.naturalWidth * k));
  c.height = Math.max(1, Math.round(img.naturalHeight * k));
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, c.width, c.height);
  }
  return c;
}

/** Full-size redraw. The browser has already applied any EXIF orientation to `img`. */
function drawFlipped(img: CanvasImageSource, width: number, height: number, o: Orient) {
  const t = canvasTransform(o, width, height);
  const c = document.createElement("canvas");
  c.width = t.width;
  c.height = t.height;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.setTransform(...t.matrix);
  ctx.drawImage(img, t.dx, t.dy);
  return c;
}

function canvasBlob(c: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("export"))), type, quality));
}

function Preview({ source, orient, label }: { source: HTMLCanvasElement; orient: Orient; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const t = canvasTransform(orient, source.width, source.height);
    c.width = t.width;
    c.height = t.height;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(...t.matrix);
    ctx.drawImage(source, t.dx, t.dy);
  }, [source, orient]);
  return <canvas ref={ref} role="img" aria-label={label} />;
}

const icon = { "aria-hidden": true, viewBox: "0 0 24 24", width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const FlipHIcon = () => (
  <svg {...icon}>
    <path d="M12 3v18" strokeDasharray="2 2.5" />
    <path d="M9 7 3 17h6z" />
    <path d="m15 7 6 10h-6z" />
  </svg>
);
const FlipVIcon = () => (
  <svg {...icon}>
    <path d="M3 12h18" strokeDasharray="2 2.5" />
    <path d="M7 9 17 3v6z" />
    <path d="m7 15 10 6v-6z" />
  </svg>
);
const RotateLeftIcon = () => (
  <svg {...icon}>
    <path d="M3 4v5h5" />
    <path d="M3.5 9A9 9 0 1 1 5 17" />
  </svg>
);
const RotateRightIcon = () => (
  <svg {...icon}>
    <path d="M21 4v5h-5" />
    <path d="M20.5 9A9 9 0 1 0 19 17" />
  </svg>
);
const DownloadIcon = () => (
  <svg {...icon} width={18} height={18}>
    <path d="M12 4v11" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 20h14" />
  </svg>
);
const RemoveIcon = () => (
  <svg {...icon} width={18} height={18}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export function FlipImageTool({ t = en }: { t?: FlipCopy }) {
  const [items, setItems] = useState<Item[]>([]);
  const [orient, setOrient] = useState<Orient>(IDENTITY);
  const [keepExact, setKeepExact] = useState(false);
  const [lossless, setLossless] = useState<Record<string, Lossless>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const webpOk = useSyncExternalStore(noSubscribe, canEncodeWebp, () => true);
  const pasteKey = useSyncExternalStore(noSubscribe, () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl"), () => "Ctrl");
  const itemsRef = useRef<Item[]>([]);
  const seq = useRef(0);
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef(new Map<number, (r: FlipReply) => void>());
  const jobs = useRef(new Map<string, Promise<Lossless>>());

  useEffect(() => {
    const worker = new Worker(new URL("../../../lib/free-tools/flip-image/worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<FlipReply>) => {
      pending.current.get(e.data.id)?.(e.data);
      pending.current.delete(e.data.id);
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      for (const it of itemsRef.current) URL.revokeObjectURL(it.url);
    };
  }, []);

  /** Lossless JPEG transform for one item, memoised per orientation. */
  const losslessFor = useCallback((it: Item, o: Orient) => {
    const k = `${it.id}|${key(o)}`;
    let job = jobs.current.get(k);
    if (!job) {
      job = it.file.arrayBuffer().then(
        (bytes) =>
          new Promise<Lossless>((resolve) => {
            const id = ++seq.current;
            pending.current.set(id, (r) => resolve(r.ok ? { ok: true, bytes: r.bytes, width: r.width, height: r.height, trimmed: r.trimmed } : { ok: false }));
            workerRef.current!.postMessage({ id, bytes, orient: o }, [bytes]);
          }),
      );
      jobs.current.set(k, job);
      void job.then((r) => setLossless((prev) => ({ ...prev, [k]: r })));
    }
    return job;
  }, []);

  // Flip JPGs in the background as soon as the orientation settles, so the
  // lossless/trim notes show before download and the download is instant.
  useEffect(() => {
    if (isIdentity(orient)) return;
    const k = key(orient);
    for (const name of [...jobs.current.keys()]) if (!name.endsWith(`|${k}`)) jobs.current.delete(name);
    const timer = setTimeout(() => {
      for (const it of items) if (it.kind === "jpeg") void losslessFor(it, orient);
    }, 250);
    return () => clearTimeout(timer);
  }, [items, orient, losslessFor]);

  const add = useCallback(
    async (files: File[]) => {
      const problems: string[] = [];
      const room = MAX_FILES - itemsRef.current.length;
      if (files.length > room) problems.push(fmt(t.errors.tooMany, { files: MAX_FILES }));
      for (const file of files.slice(0, Math.max(0, room))) {
        const name = file.name || "image.png";
        const kind = KIND[file.type];
        if (!kind || !(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
          problems.push(fmt(t.errors.type, { name }));
          continue;
        }
        if (file.size > LIMITS.mb * 1024 * 1024) {
          problems.push(fmt(t.errors.bytes, { name, mb: LIMITS.mb }));
          continue;
        }
        try {
          const { img, url } = await loadImage(file);
          const width = img.naturalWidth;
          const height = img.naturalHeight;
          if (width * height > LIMITS.megapixels * 1_000_000) {
            URL.revokeObjectURL(url);
            problems.push(fmt(t.errors.pixels, { name, mp: Math.round((width * height) / 1e6), max: LIMITS.megapixels }));
            continue;
          }
          const item: Item = { id: ++seq.current, name, file, kind, img, url, width, height, preview: previewOf(img) };
          itemsRef.current = [...itemsRef.current, item];
          setItems(itemsRef.current);
        } catch {
          problems.push(fmt(t.errors.decode, { name }));
        }
      }
      setErrors(problems);
    },
    [t],
  );

  // Paste a screenshot or copied image anywhere on the page (not while typing in a field).
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;
      const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith("image/"));
      if (!files.length) return;
      e.preventDefault();
      void add(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [add]);

  const remove = (id: number) => {
    const it = itemsRef.current.find((x) => x.id === id);
    if (it) URL.revokeObjectURL(it.url);
    itemsRef.current = itemsRef.current.filter((x) => x.id !== id);
    setItems(itemsRef.current);
    for (const name of [...jobs.current.keys()]) if (name.startsWith(`${id}|`)) jobs.current.delete(name);
  };

  const clear = () => {
    for (const it of itemsRef.current) URL.revokeObjectURL(it.url);
    itemsRef.current = [];
    setItems([]);
    setErrors([]);
    setOrient(IDENTITY);
    jobs.current.clear();
    setLossless({});
  };

  const apply = (step: Orient) => setOrient((o) => compose(o, step));

  const outputFor = async (it: Item, o: Orient): Promise<Output & { lossless: boolean }> => {
    const stem = `${baseName(it.name)}-flipped`;
    if (it.kind === "jpeg" && !keepExact) {
      const r = await losslessFor(it, o);
      if (r.ok) return { blob: new Blob([r.bytes], { type: "image/jpeg" }), name: `${stem}.jpg`, lossless: true };
    }
    const c = drawFlipped(it.img, it.width, it.height, o);
    const kind: Kind = it.kind === "webp" && !webpOk ? "png" : it.kind;
    const type = `image/${kind}`;
    // WebP at quality 1 is encoded losslessly by Chromium; JPG has no lossless canvas option.
    const blob = await canvasBlob(c, type, kind === "jpeg" ? JPEG_QUALITY : kind === "webp" ? 1 : undefined);
    const ext = blob.type === type ? EXT[kind] : "png";
    return { blob, name: `${stem}.${ext}`, lossless: false };
  };

  const track = (outs: { lossless: boolean }[], count: number) =>
    trackEvent("Flip Image Download", {
      change: orientName(orient),
      formats: [...new Set(itemsRef.current.map((it) => it.kind))].sort().join(","),
      lossless: outs.every((x) => x.lossless) ? "all" : outs.some((x) => x.lossless) ? "some" : "none",
      count: String(count),
    });

  const downloadOne = async (it: Item) => {
    setBusy(true);
    try {
      const out = await outputFor(it, orient);
      track([out], 1);
      saveBlob(out.blob, out.name);
    } catch {
      setErrors([fmt(t.errors.export, { name: it.name })]);
    }
    setBusy(false);
  };

  const downloadAll = async () => {
    setBusy(true);
    const files: Record<string, [Uint8Array, { level: 0 }]> = {};
    const outs: { lossless: boolean }[] = [];
    const problems: string[] = [];
    for (const it of itemsRef.current) {
      try {
        const out = await outputFor(it, orient);
        let name = out.name;
        for (let n = 2; files[name]; n++) name = out.name.replace(/(\.[^.]+)$/, `-${n}$1`);
        files[name] = [new Uint8Array(await out.blob.arrayBuffer()), { level: 0 }];
        outs.push(out);
      } catch {
        problems.push(fmt(t.errors.export, { name: it.name }));
      }
    }
    if (outs.length) {
      track(outs, outs.length);
      saveBlob(new Blob([zipSync(files) as BlobPart], { type: "application/zip" }), "flipped-images.zip");
    }
    setErrors(problems);
    setBusy(false);
  };

  const onDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setOver(false);
    if (e.dataTransfer?.files?.length) void add([...e.dataTransfer.files]);
  };

  const changed = !isIdentity(orient);
  const k = key(orient);
  const resultOf = (it: Item) => (it.kind === "jpeg" && changed ? lossless[`${it.id}|${k}`] : undefined);
  const anyTrimmed = items.some((it) => {
    const r = resultOf(it);
    return r?.ok && (r.trimmed.x > 0 || r.trimmed.y > 0);
  });

  const details = (it: Item) => {
    const r = resultOf(it);
    const out = r?.ok && !keepExact ? r : outputSize(orient, it.width, it.height);
    const lines: { text: string; positive?: boolean }[] = [{ text: fmt(t.list.size, { w: out.width, h: out.height }) }];
    if (!changed) return lines;
    if (it.kind === "jpeg") {
      if (r?.ok && !keepExact) {
        lines.push({ text: t.list.lossless, positive: true });
        const n = r.trimmed.x + r.trimmed.y;
        if (n > 0) lines.push({ text: fmt(t.list.trimmed, { n }) });
      } else if (r || keepExact) lines.push({ text: t.list.reencoded });
    } else if (it.kind === "webp" && !webpOk) lines.push({ text: t.list.pngOut });
    return lines;
  };

  const fileInput = (
    <input
      type="file"
      multiple
      accept={ACCEPTED_TYPES.join(",")}
      onChange={(e) => {
        const files = [...(e.target.files ?? [])];
        e.target.value = "";
        if (files.length) void add(files);
      }}
    />
  );

  const errorList = errors.length ? (
    <div role="alert">
      {errors.map((e) => (
        <p key={e} className={shape.error}>
          {e}
        </p>
      ))}
    </div>
  ) : null;

  if (!items.length) {
    return (
      <section className={shape.tool} id="tool" aria-label={t.name}>
        <label
          className={shape.drop}
          data-over={over}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
        >
          {fileInput}
          <strong>{t.drop.title}</strong>
          <span className={shape.dropAction}>{t.drop.action}</span>
          <small>{fmt(t.drop.paste, { key: pasteKey })}</small>
          <small>{fmt(t.drop.limits, { files: MAX_FILES, mb: LIMITS.mb })}</small>
        </label>
        {errorList}
      </section>
    );
  }

  return (
    <section
      className={shape.tool}
      id="tool"
      aria-label={t.name}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className={styles.workspace}>
        <ul className={styles.grid} data-single={items.length === 1}>
          {items.map((it) => (
            <li key={it.id} className={styles.card}>
              <div className={styles.thumb}>
                <Preview source={it.preview} orient={orient} label={`${it.name}: ${t.state[orientName(orient)]}`} />
              </div>
              {items.length > 1 ? (
                <div className={styles.cardActions}>
                    <button type="button" className={styles.iconButton} aria-label={`${t.output.download} ${it.name}`} disabled={!changed || busy} onClick={() => void downloadOne(it)}>
                      <DownloadIcon />
                    </button>
                    <button type="button" className={styles.iconButton} aria-label={fmt(t.list.remove, { name: it.name })} onClick={() => remove(it.id)}>
                      <RemoveIcon />
                    </button>
                </div>
              ) : null}
              <div className={styles.meta}>
                <div className={styles.metaText}>
                  <span className={styles.name} title={it.name}>
                    {it.name}
                  </span>
                  {details(it).map((d) => (
                    <span key={d.text} className={styles.detail} data-tone={d.positive ? "positive" : undefined}>
                      {d.text}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className={styles.panel}>
          <div>
            <p className={shape.label}>{t.controls.label}</p>
            <div className={styles.controls}>
              <button type="button" className={styles.control} onClick={() => apply(FLIP_H)}>
                <FlipHIcon />
                {t.controls.flipH}
              </button>
              <button type="button" className={styles.control} onClick={() => apply(FLIP_V)}>
                <FlipVIcon />
                {t.controls.flipV}
              </button>
              <button type="button" className={styles.control} onClick={() => apply(ROTATE_CCW)}>
                <RotateLeftIcon />
                {t.controls.rotateLeft}
              </button>
              <button type="button" className={styles.control} onClick={() => apply(ROTATE_CW)}>
                <RotateRightIcon />
                {t.controls.rotateRight}
              </button>
            </div>
          </div>
          <p className={styles.state} data-changed={changed} aria-live="polite">
            {t.state[orientName(orient)]}
          </p>

          {anyTrimmed || keepExact ? (
            <div>
              <label className={styles.check}>
                <input type="checkbox" checked={keepExact} onChange={(e) => setKeepExact(e.target.checked)} />
                <span>{t.output.keepExact}</span>
              </label>
              <p className={styles.hint}>{t.output.keepExactHint}</p>
            </div>
          ) : null}

          <div className={styles.actions}>
            <button
              type="button"
              className={shape.primary}
              disabled={!changed || busy}
              onClick={() => void (items.length === 1 ? downloadOne(items[0]) : downloadAll())}
            >
              {busy ? t.output.working : items.length === 1 ? t.output.download : fmt(t.output.downloadZip, { n: items.length })}
            </button>
            <div className={styles.row}>
              {items.length < MAX_FILES ? (
                <label className={styles.addLabel}>
                  {fileInput}
                  {t.output.add}
                </label>
              ) : null}
              {changed ? (
                <button type="button" className={shape.ghost} onClick={() => setOrient(IDENTITY)}>
                  {t.controls.reset}
                </button>
              ) : null}
              <button type="button" className={shape.ghost} onClick={clear}>
                {t.output.clear}
              </button>
            </div>
          </div>
          {errorList}
        </div>
      </div>
    </section>
  );
}
