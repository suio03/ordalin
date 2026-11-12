"use client";

// Building blocks shared by the circle crop and square image tools: file
// loading with limits, the drag/pinch/zoom crop stage, previews and export.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type DragEvent, type KeyboardEvent, type PointerEvent } from "react";
import { fmt, type ImageShapeCopy } from "@/lib/free-tools/image-shape/copy";
import {
  LIMITS,
  checkFile,
  checkPixels,
  defaultCrop,
  panCrop,
  sliderToSide,
  zoomCrop,
  zoomToSlider,
  type Crop,
  type Size,
} from "@/lib/free-tools/image-shape/geometry";
import { EXT, flatten, saveBlob, toBlob, type Format } from "@/lib/free-tools/image-shape/render";
import styles from "./image-shape.module.css";

export type Loaded = { img: HTMLImageElement; name: string; size: Size };

/** Loads one image file, enforcing the type, byte and pixel limits. */
export function useImageFile(t: ImageShapeCopy) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  const release = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  };
  useEffect(() => release, []);

  const load = useCallback(
    (file: File) => {
      const problem = checkFile(file.type, file.size);
      if (problem) {
        setError(problem === "type" ? t.errors.type : fmt(t.errors.bytes, { mb: LIMITS.mb }));
        return;
      }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        const size = { width: img.naturalWidth, height: img.naturalHeight };
        if (checkPixels(size)) {
          URL.revokeObjectURL(url);
          setError(fmt(t.errors.pixels, { mp: Math.round((size.width * size.height) / 1e6), max: LIMITS.megapixels }));
          return;
        }
        release();
        urlRef.current = url;
        setError(null);
        setLoaded({ img, name: file.name, size });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        setError(t.errors.decode);
      };
      img.src = url;
    },
    [t],
  );

  const clear = useCallback(() => {
    release();
    setLoaded(null);
    setError(null);
  }, []);

  return { loaded, error, load, clear, setError };
}

/** The crop for the current image; resets to the default crop whenever a new image loads. */
export function useCrop(loaded: Loaded | null) {
  const [state, setState] = useState<{ of: Loaded | null; crop: Crop | null }>({ of: null, crop: null });
  const crop = !loaded ? null : state.of === loaded && state.crop ? state.crop : defaultCrop(loaded.size);
  const setCrop = useCallback((c: Crop) => setState({ of: loaded, crop: c }), [loaded]);
  return [crop, setCrop] as const;
}

export function ImageDrop({ t, onFile, error }: { t: ImageShapeCopy; onFile: (f: File) => void; error: string | null }) {
  const [over, setOver] = useState(false);
  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setOver(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };
  return (
    <>
      <label
        className={styles.drop}
        data-over={over}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
        <strong>{t.drop.title}</strong>
        <span className={styles.dropAction}>{t.drop.action}</span>
        <small>{fmt(t.drop.limits, { mb: LIMITS.mb })}</small>
      </label>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </>
  );
}

/** Keeps a canvas the size of its box (in device pixels) and returns the CSS side length. */
function useSquareBox() {
  const ref = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSide(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, side };
}

const MASK_SHARE = 0.84;

/**
 * The interactive crop stage: the image under a circle or square window.
 * Drag (mouse or one finger), pinch, scroll wheel, slider and keyboard all move or zoom the crop.
 */
export function CropStage({
  t,
  img,
  size,
  crop,
  onCrop,
  shape,
  allowOutside,
  onReset,
}: {
  t: ImageShapeCopy;
  img: HTMLImageElement;
  size: Size;
  crop: Crop;
  onCrop: (c: Crop) => void;
  shape: "circle" | "square";
  allowOutside: boolean;
  onReset: () => void;
}) {
  const { ref, side } = useSquareBox();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropRef = useRef(crop);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const mask = side * MASK_SHARE;
  const scale = mask / crop.side;
  const scaleRef = useRef(scale);
  // Pointer and wheel handlers read the latest crop and scale through refs.
  useLayoutEffect(() => {
    cropRef.current = crop;
    scaleRef.current = scale;
  }, [crop, scale]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !side) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(side * dpr);
    c.height = Math.round(side * dpr);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, side, side);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, side / 2 - crop.cx * scale, side / 2 - crop.cy * scale, size.width * scale, size.height * scale);
  }, [img, size, crop, scale, side]);

  const zoomAt = useCallback(
    (factor: number, px = 0, py = 0) => onCrop(zoomCrop(cropRef.current, factor, px, py, scaleRef.current, size, allowOutside)),
    [onCrop, size, allowOutside],
  );

  // Wheel needs a non-passive listener so the page doesn't scroll while zooming.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [ref, zoomAt]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Capture is a nicety; dragging still works inside the stage without it.
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const map = pointers.current;
    const prev = map.get(e.pointerId);
    if (!prev) return;
    if (map.size === 1) {
      map.set(e.pointerId, { x: e.clientX, y: e.clientY });
      onCrop(panCrop(cropRef.current, e.clientX - prev.x, e.clientY - prev.y, scaleRef.current, size, allowOutside));
      return;
    }
    // Pinch: zoom by the change in finger distance, around the midpoint.
    const [a, b] = [...map.entries()].slice(0, 2);
    const other = a[0] === e.pointerId ? b[1] : a[1];
    const before = Math.hypot(prev.x - other.x, prev.y - other.y);
    const after = Math.hypot(e.clientX - other.x, e.clientY - other.y);
    map.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (before < 1) return;
    const r = e.currentTarget.getBoundingClientRect();
    zoomAt(after / before, (e.clientX + other.x) / 2 - r.left - r.width / 2, (e.clientY + other.y) / 2 - r.top - r.height / 2);
  };
  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 50 : 10;
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      onCrop(panCrop(cropRef.current, dx, dy, scaleRef.current, size, allowOutside));
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      zoomAt(1.15);
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      zoomAt(1 / 1.15);
    }
  };

  const slider = zoomToSlider(crop.side, size, allowOutside);

  return (
    <div className={styles.stageWrap}>
      <div
        ref={ref}
        className={styles.stage}
        role="application"
        tabIndex={0}
        aria-label={t.stage.label}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={onKeyDown}
      >
        <canvas ref={canvasRef} className={styles.stageCanvas} />
        <div className={styles.mask} data-shape={shape} style={{ width: mask, height: mask }} />
      </div>
      <p className={styles.stageHint}>{t.stage.hint}</p>
      <div className={styles.zoomRow}>
        <button type="button" className={styles.iconButton} aria-label={t.stage.zoomOut} onClick={() => zoomAt(1 / 1.2)}>
          −
        </button>
        <label className={styles.zoomLabel}>
          <span className={styles.srOnly}>{t.stage.zoom}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={slider}
            onChange={(e) => onCrop(zoomCrop(crop, crop.side / sliderToSide(Number(e.target.value), size, allowOutside), 0, 0, scale, size, allowOutside))}
          />
        </label>
        <button type="button" className={styles.iconButton} aria-label={t.stage.zoomIn} onClick={() => zoomAt(1.2)}>
          +
        </button>
        <button type="button" className={styles.ghost} onClick={onReset}>
          {t.stage.reset}
        </button>
      </div>
    </div>
  );
}

/** Draws an already-rendered canvas into a visible one, scaled to fit. */
export function CanvasView({ source, className, label }: { source: HTMLCanvasElement | null; className?: string; label?: string }) {
  const { ref, side } = useSquareBox();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !side || !source) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(side * dpr);
    c.height = Math.round(side * dpr);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, c.width, c.height);
  }, [source, side]);
  return (
    <div ref={ref} className={className}>
      <canvas ref={canvasRef} className={styles.viewCanvas} role={label ? "img" : undefined} aria-label={label} />
    </div>
  );
}

export function Previews({ t, source }: { t: ImageShapeCopy; source: HTMLCanvasElement | null }) {
  return (
    <div className={styles.previews}>
      <p className={styles.label}>{t.output.preview}</p>
      <div className={styles.previewPair}>
        <figure>
          <CanvasView source={source} className={styles.previewLight} label={t.output.onLight} />
          <figcaption>{t.output.onLight}</figcaption>
        </figure>
        <figure>
          <CanvasView source={source} className={styles.previewDark} label={t.output.onDark} />
          <figcaption>{t.output.onDark}</figcaption>
        </figure>
      </div>
    </div>
  );
}

export type SizeChoice = "original" | number;

export function OutputControls({
  t,
  presets,
  naturalSide,
  sizeChoice,
  onSize,
  format,
  onFormat,
  transparent,
  busy,
  onDownload,
}: {
  t: ImageShapeCopy;
  presets: number[];
  naturalSide: number;
  sizeChoice: SizeChoice;
  onSize: (s: SizeChoice) => void;
  format: Format;
  onFormat: (f: Format) => void;
  transparent: boolean;
  busy: boolean;
  onDownload: () => void;
}) {
  const original = Math.min(LIMITS.maxOutput, Math.round(naturalSide));
  const upscaled = sizeChoice !== "original" && sizeChoice > naturalSide * 1.05;
  return (
    <div className={styles.output}>
      <div className={styles.fieldRow}>
        <label className={styles.field}>
          <span className={styles.label}>{t.output.size}</span>
          <select value={String(sizeChoice)} onChange={(e) => onSize(e.target.value === "original" ? "original" : Number(e.target.value))}>
            <option value="original">{fmt(t.output.original, { n: original })}</option>
            {presets.map((p) => (
              <option key={p} value={p}>
                {fmt(t.output.px, { n: p })}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t.output.format}</span>
          <select value={format} onChange={(e) => onFormat(e.target.value as Format)}>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
            <option value="jpeg">JPG</option>
          </select>
        </label>
      </div>
      {upscaled ? <p className={styles.note}>{t.output.upscaled}</p> : null}
      {format === "jpeg" && transparent ? <p className={styles.note}>{t.output.jpegNote}</p> : null}
      <button type="button" className={styles.primary} disabled={busy} onClick={onDownload}>
        {busy ? t.output.working : fmt(t.output.download, { format: format === "jpeg" ? "JPG" : format === "webp" ? "WebP" : "PNG" })}
      </button>
    </div>
  );
}

/** Exports a rendered canvas in the chosen format and saves it. */
export async function exportCanvas(c: HTMLCanvasElement, format: Format, name: string) {
  const blob = await toBlob(format === "jpeg" ? flatten(c) : c, format);
  saveBlob(blob, `${name}.${EXT[format]}`);
}

/** Colour choice used for the circle background and the square fill. */
export function ColorChoice<K extends string>({
  t,
  legend,
  options,
  value,
  onChange,
  custom,
  onCustom,
}: {
  t: ImageShapeCopy;
  legend: string;
  options: { key: K; label: string; swatch?: string }[];
  value: K;
  onChange: (k: K) => void;
  custom?: string;
  onCustom?: (c: string) => void;
}) {
  return (
    <fieldset className={styles.choice}>
      <legend className={styles.label}>{legend}</legend>
      <div className={styles.chips}>
        {options.map((o) => (
          <label key={o.key} className={styles.chip}>
            <input type="radio" name={legend} checked={value === o.key} onChange={() => onChange(o.key)} />
            {o.swatch ? <span className={styles.swatch} data-swatch={o.swatch} /> : null}
            {o.label}
          </label>
        ))}
        {onCustom ? (
          <label className={styles.chip}>
            <input type="radio" name={legend} checked={value === ("custom" as K)} onChange={() => onChange("custom" as K)} />
            <input
              type="color"
              className={styles.colorInput}
              aria-label={t.colors.customLabel}
              value={custom}
              onChange={(e) => {
                onCustom(e.target.value);
                onChange("custom" as K);
              }}
            />
            {t.colors.custom}
          </label>
        ) : null}
      </div>
    </fieldset>
  );
}
