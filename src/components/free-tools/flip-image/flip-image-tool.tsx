"use client";

// Flip and rotate images in the browser. JPGs are flipped losslessly in a
// worker (coefficient transform, like jpegtran); PNG and WebP are redrawn on a
// canvas at full size. Nothing is uploaded.
import { zipSync } from "fflate";
import { useEffect, useRef, useState, type DragEvent } from "react";
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
import { fmt } from "@/lib/free-tools/image-shape/copy";
import { baseName, saveBlob } from "@/lib/free-tools/image-shape/render";
import shape from "../image-shape/image-shape.module.css";
import styles from "./flip-image.module.css";
import {
  canvasBlob,
  DownloadIcon,
  dropFiles,
  DropZone,
  ErrorList,
  EXT,
  FileInput,
  FlipHIcon,
  FlipVIcon,
  JPEG_QUALITY,
  MAX_FILES,
  orientKey,
  RemoveIcon,
  RotateLeftIcon,
  RotateRightIcon,
  useImageItems,
  useLosslessJpeg,
  useWebpEncode,
  type Item,
  type Kind,
  type Output,
} from "./shared";

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

export function FlipImageTool({ t = en }: { t?: FlipCopy }) {
  const [orient, setOrient] = useState<Orient>(IDENTITY);
  const [keepExact, setKeepExact] = useState(false);
  const [busy, setBusy] = useState(false);
  const webpOk = useWebpEncode();
  const { losslessFor, resultFor, prune, reset } = useLosslessJpeg();
  const { items, itemsRef, errors, setErrors, add, remove, clearItems } = useImageItems(t, (id) => prune((k) => !k.startsWith(`${id}|`)));

  // Flip JPGs in the background as soon as the orientation settles, so the
  // lossless/trim notes show before download and the download is instant.
  useEffect(() => {
    if (isIdentity(orient)) return;
    const k = orientKey(orient);
    prune((name) => name.endsWith(`|${k}`));
    const timer = setTimeout(() => {
      for (const it of items) if (it.kind === "jpeg") void losslessFor(it, orient);
    }, 250);
    return () => clearTimeout(timer);
  }, [items, orient, losslessFor, prune]);

  const clear = () => {
    clearItems();
    setOrient(IDENTITY);
    reset();
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
    const files = dropFiles(e);
    if (files.length) void add(files);
  };

  const changed = !isIdentity(orient);
  const resultOf = (it: Item) => (it.kind === "jpeg" && changed ? resultFor(it, orient) : undefined);
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

  const fileInput = <FileInput onFiles={(files) => void add(files)} />;
  const errorList = <ErrorList errors={errors} />;

  if (!items.length) return <DropZone t={t} name={t.name} errors={errors} onFiles={(files) => void add(files)} />;

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
