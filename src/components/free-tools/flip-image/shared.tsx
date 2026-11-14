"use client";

// Shared by the flip image and mirror image tools: image list (drop, paste,
// limits), lossless JPEG worker, canvas helpers and icons. Nothing is uploaded.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type DragEvent, type ReactNode } from "react";
import type { FlipCopy } from "@/lib/free-tools/flip-image/copy";
import type { Orient } from "@/lib/free-tools/flip-image/orient";
import type { FlipReply } from "@/lib/free-tools/flip-image/worker";
import { fmt } from "@/lib/free-tools/image-shape/copy";
import { ACCEPTED_TYPES, LIMITS } from "@/lib/free-tools/image-shape/geometry";
import shape from "../image-shape/image-shape.module.css";

export const MAX_FILES = 10;
export const JPEG_QUALITY = 0.95;
const PREVIEW_SIDE = 1024;

export type Kind = "jpeg" | "png" | "webp";
export type Item = { id: number; name: string; file: File; kind: Kind; img: HTMLImageElement; url: string; width: number; height: number; preview: HTMLCanvasElement };
export type Lossless = { ok: true; bytes: ArrayBuffer; width: number; height: number; trimmed: { x: number; y: number } } | { ok: false };
export type Output = { blob: Blob; name: string };
type ToolText = Pick<FlipCopy, "drop" | "errors">;

const KIND: Record<string, Kind> = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" };
export const EXT: Record<Kind, string> = { jpeg: "jpg", png: "png", webp: "webp" };
export const orientKey = (o: Orient) => o.join(",");
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
export const useWebpEncode = () => useSyncExternalStore(noSubscribe, canEncodeWebp, () => true);
export const usePasteKey = () =>
  useSyncExternalStore(noSubscribe, () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl"), () => "Ctrl");

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

/** A small copy of the image for previews, so changes stay instant on large photos. */
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

export function canvasBlob(c: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("export"))), type, quality));
}

/** The image list: add with type/size/pixel checks, paste anywhere, remove, clear. */
export function useImageItems(t: ToolText, onRemove?: (id: number) => void) {
  const [items, setItems] = useState<Item[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const seq = useRef(0);

  useEffect(
    () => () => {
      for (const it of itemsRef.current) URL.revokeObjectURL(it.url);
    },
    [],
  );

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
    onRemove?.(id);
  };

  const clearItems = () => {
    for (const it of itemsRef.current) URL.revokeObjectURL(it.url);
    itemsRef.current = [];
    setItems([]);
    setErrors([]);
  };

  return { items, itemsRef, errors, setErrors, add, remove, clearItems };
}

/** Lossless JPEG transforms in a worker, memoised per item and orientation. */
export function useLosslessJpeg() {
  const [lossless, setLossless] = useState<Record<string, Lossless>>({});
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef(new Map<number, (r: FlipReply) => void>());
  const jobs = useRef(new Map<string, Promise<Lossless>>());
  const seq = useRef(0);

  useEffect(() => {
    const worker = new Worker(new URL("../../../lib/free-tools/flip-image/worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<FlipReply>) => {
      pending.current.get(e.data.id)?.(e.data);
      pending.current.delete(e.data.id);
    };
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const losslessFor = useCallback((it: Item, o: Orient) => {
    const k = `${it.id}|${orientKey(o)}`;
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

  /** Drop memoised jobs whose key fails `keep`. */
  const prune = useCallback((keep: (k: string) => boolean) => {
    for (const k of [...jobs.current.keys()]) if (!keep(k)) jobs.current.delete(k);
  }, []);

  const reset = useCallback(() => {
    jobs.current.clear();
    setLossless({});
  }, []);

  /** Result for an item already transformed in the background, if any. */
  const resultFor = (it: Item, o: Orient): Lossless | undefined => lossless[`${it.id}|${orientKey(o)}`];

  return { losslessFor, resultFor, prune, reset };
}

export function FileInput({ onFiles }: { onFiles: (files: File[]) => void }) {
  return (
    <input
      type="file"
      multiple
      accept={ACCEPTED_TYPES.join(",")}
      onChange={(e) => {
        const files = [...(e.target.files ?? [])];
        e.target.value = "";
        if (files.length) onFiles(files);
      }}
    />
  );
}

export function ErrorList({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div role="alert">
      {errors.map((e) => (
        <p key={e} className={shape.error}>
          {e}
        </p>
      ))}
    </div>
  );
}

export function dropFiles(e: DragEvent<HTMLElement>) {
  e.preventDefault();
  return e.dataTransfer?.files?.length ? [...e.dataTransfer.files] : [];
}

/** Empty state: the drop zone. */
export function DropZone({ t, name, errors, onFiles }: { t: ToolText; name: string; errors: string[]; onFiles: (files: File[]) => void }) {
  const [over, setOver] = useState(false);
  const pasteKey = usePasteKey();
  return (
    <section className={shape.tool} id="tool" aria-label={name}>
      <label
        className={shape.drop}
        data-over={over}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          setOver(false);
          const files = dropFiles(e);
          if (files.length) onFiles(files);
        }}
      >
        <FileInput onFiles={onFiles} />
        <strong>{t.drop.title}</strong>
        <span className={shape.dropAction}>{t.drop.action}</span>
        <small>{fmt(t.drop.paste, { key: pasteKey })}</small>
        <small>{fmt(t.drop.limits, { files: MAX_FILES, mb: LIMITS.mb })}</small>
      </label>
      <ErrorList errors={errors} />
    </section>
  );
}

const icon = { "aria-hidden": true, viewBox: "0 0 24 24", width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
function Svg({ size = 20, children }: { size?: number; children: ReactNode }) {
  return (
    <svg {...icon} width={size} height={size}>
      {children}
    </svg>
  );
}
export const FlipHIcon = () => (
  <Svg>
    <path d="M12 3v18" strokeDasharray="2 2.5" />
    <path d="M9 7 3 17h6z" />
    <path d="m15 7 6 10h-6z" />
  </Svg>
);
export const FlipVIcon = () => (
  <Svg>
    <path d="M3 12h18" strokeDasharray="2 2.5" />
    <path d="M7 9 17 3v6z" />
    <path d="m7 15 10 6v-6z" />
  </Svg>
);
export const RotateLeftIcon = () => (
  <Svg>
    <path d="M3 4v5h5" />
    <path d="M3.5 9A9 9 0 1 1 5 17" />
  </Svg>
);
export const RotateRightIcon = () => (
  <Svg>
    <path d="M21 4v5h-5" />
    <path d="M20.5 9A9 9 0 1 0 19 17" />
  </Svg>
);
export const DownloadIcon = () => (
  <Svg size={18}>
    <path d="M12 4v11" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 20h14" />
  </Svg>
);
export const RemoveIcon = () => (
  <Svg size={18}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
