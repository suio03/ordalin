"use client";

// Mirror, symmetry and reflection effects in the browser. Mirror mode reuses
// the flip tool's lossless JPEG worker; symmetry and reflection are drawn on a
// canvas. Nothing is uploaded.
import { zipSync } from "fflate";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { trackEvent } from "@/lib/analytics";
import { FLIP_H, FLIP_V, type Orient } from "@/lib/free-tools/flip-image/orient";
import { fmt } from "@/lib/free-tools/image-shape/copy";
import { LIMITS } from "@/lib/free-tools/image-shape/geometry";
import { baseName, saveBlob } from "@/lib/free-tools/image-shape/render";
import { en, type MirrorCopy } from "@/lib/free-tools/mirror-image/copy";
import { fitScale, LINE_MAX, LINE_MIN, mirrorLayout, mirrorName, type Layout, type MirrorSettings, type Side } from "@/lib/free-tools/mirror-image/layout";
import flip from "../flip-image/flip-image.module.css";
import {
  canvasBlob,
  DownloadIcon,
  dropFiles,
  DropZone,
  ErrorList,
  EXT,
  FileInput,
  JPEG_QUALITY,
  MAX_FILES,
  RemoveIcon,
  useImageItems,
  useLosslessJpeg,
  useWebpEncode,
  type Item,
  type Kind,
  type Output,
} from "../flip-image/shared";
import shape from "../image-shape/image-shape.module.css";

type Mode = MirrorSettings["mode"];
type Axis = "h" | "v";

/** iOS Safari refuses canvases over ~16.7 MP; desktop browsers take the input limit. */
function maxOutputPixels() {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios ? 16_700_000 : LIMITS.megapixels * 1_000_000;
}

/**
 * Draw a layout. Layout coordinates are in original pixels; `k` maps them to
 * `src` pixels (preview canvases are smaller), `d` to output pixels.
 */
function renderLayout(src: CanvasImageSource, k: number, l: Layout, d: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(l.width * d));
  c.height = Math.max(1, Math.round(l.height * d));
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.imageSmoothingQuality = "high";
  for (const p of l.pieces) {
    const w = p.sw * d;
    const h = p.sh * d;
    ctx.save();
    ctx.translate(p.dx * d, p.dy * d);
    if (p.flip === "h") ctx.setTransform(-1, 0, 0, 1, p.dx * d + w, p.dy * d);
    if (p.flip === "v") ctx.setTransform(1, 0, 0, -1, p.dx * d, p.dy * d + h);
    ctx.drawImage(src, p.sx * k, p.sy * k, p.sw * k, p.sh * k, 0, 0, w, h);
    ctx.restore();
  }
  if (l.fade) {
    const f = l.fade;
    // destination-out keeps alpha × (1 − g): `from` at the seam, 0 at the far edge.
    const g = ctx.createLinearGradient(f.x0 * d, f.y0 * d, f.x1 * d, f.y1 * d);
    g.addColorStop(0, `rgba(0,0,0,${1 - f.from})`);
    g.addColorStop(1, "rgba(0,0,0,1)");
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = g;
    ctx.fillRect(f.x * d, f.y * d, f.w * d, f.h * d);
    ctx.restore();
  }
  return c;
}

function Preview({ item, settings, label }: { item: Item; settings: MirrorSettings; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const view = ref.current;
    if (!view) return;
    const k = item.preview.width / item.width;
    const out = renderLayout(item.preview, k, mirrorLayout(item.width, item.height, settings), k);
    view.width = out.width;
    view.height = out.height;
    view.getContext("2d")?.drawImage(out, 0, 0);
  }, [item, settings]);
  return <canvas ref={ref} role="img" aria-label={label} />;
}

function Chips<T extends string>({ legend, name, options, value, onChange }: { legend: string; name: string; options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <fieldset className={shape.choice}>
      <legend className={shape.label}>{legend}</legend>
      <div className={shape.chips}>
        {options.map((o) => (
          <label key={o.key} className={shape.chip}>
            <input type="radio" name={name} checked={value === o.key} onChange={() => onChange(o.key)} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function MirrorImageTool({ t = en }: { t?: MirrorCopy }) {
  const [mode, setMode] = useState<Mode>("mirror");
  const [axis, setAxis] = useState<Axis>("h");
  const [keep, setKeep] = useState<Side>("left");
  const [line, setLine] = useState(0.5);
  const [side, setSide] = useState<Side>("bottom");
  const [fade, setFade] = useState(false);
  const [keepExact, setKeepExact] = useState(false);
  const [busy, setBusy] = useState(false);
  const webpOk = useWebpEncode();
  const { losslessFor, resultFor, prune, reset } = useLosslessJpeg();
  const { items, itemsRef, errors, setErrors, add, remove, clearItems } = useImageItems(t, (id) => prune((k) => !k.startsWith(`${id}|`)));

  const settings = useMemo<MirrorSettings>(
    () => (mode === "mirror" ? { mode, axis } : mode === "symmetry" ? { mode, keep, line } : { mode, side, fade }),
    [mode, axis, keep, line, side, fade],
  );
  const orient: Orient = axis === "h" ? FLIP_H : FLIP_V;

  // Mirror JPGs losslessly in the background once the direction settles.
  useEffect(() => {
    if (mode !== "mirror") return;
    const timer = setTimeout(() => {
      for (const it of items) if (it.kind === "jpeg") void losslessFor(it, orient);
    }, 250);
    return () => clearTimeout(timer);
  }, [items, mode, orient, losslessFor]);

  const clear = () => {
    clearItems();
    reset();
  };

  /** Output format for canvas modes: a fade needs alpha, so JPG becomes PNG. */
  const canvasKind = (it: Item): Kind => {
    if (it.kind === "jpeg") return settings.mode === "reflection" && settings.fade ? "png" : "jpeg";
    if (it.kind === "webp" && !webpOk) return "png";
    return it.kind;
  };

  const outputFor = async (it: Item): Promise<Output & { lossless: boolean }> => {
    const stem = `${baseName(it.name)}-mirrored`;
    if (settings.mode === "mirror" && it.kind === "jpeg" && !keepExact) {
      const r = await losslessFor(it, orient);
      if (r.ok) return { blob: new Blob([r.bytes], { type: "image/jpeg" }), name: `${stem}.jpg`, lossless: true };
    }
    const l = mirrorLayout(it.width, it.height, settings);
    const c = renderLayout(it.img, 1, l, fitScale(l.width, l.height, maxOutputPixels()));
    const kind = canvasKind(it);
    const type = `image/${kind}`;
    // WebP at quality 1 is encoded losslessly by Chromium; JPG has no lossless canvas option.
    const blob = await canvasBlob(c, type, kind === "jpeg" ? JPEG_QUALITY : kind === "webp" ? 1 : undefined);
    const ext = blob.type === type ? EXT[kind] : "png";
    return { blob, name: `${stem}.${ext}`, lossless: false };
  };

  const track = (count: number) =>
    trackEvent("Mirror Image Download", {
      mode: mirrorName(settings),
      formats: [...new Set(itemsRef.current.map((it) => it.kind))].sort().join(","),
      count: String(count),
    });

  const downloadOne = async (it: Item) => {
    setBusy(true);
    try {
      const out = await outputFor(it);
      track(1);
      saveBlob(out.blob, out.name);
    } catch {
      setErrors([fmt(t.errors.export, { name: it.name })]);
    }
    setBusy(false);
  };

  const downloadAll = async () => {
    setBusy(true);
    const files: Record<string, [Uint8Array, { level: 0 }]> = {};
    const problems: string[] = [];
    let done = 0;
    for (const it of itemsRef.current) {
      try {
        const out = await outputFor(it);
        let name = out.name;
        for (let n = 2; files[name]; n++) name = out.name.replace(/(\.[^.]+)$/, `-${n}$1`);
        files[name] = [new Uint8Array(await out.blob.arrayBuffer()), { level: 0 }];
        done++;
      } catch {
        problems.push(fmt(t.errors.export, { name: it.name }));
      }
    }
    if (done) {
      track(done);
      saveBlob(new Blob([zipSync(files) as BlobPart], { type: "application/zip" }), "mirrored-images.zip");
    }
    setErrors(problems);
    setBusy(false);
  };

  const onDrop = (e: DragEvent<HTMLElement>) => {
    const files = dropFiles(e);
    if (files.length) void add(files);
  };

  const losslessResult = (it: Item) => (mode === "mirror" && it.kind === "jpeg" ? resultFor(it, orient) : undefined);
  const anyTrimmed = items.some((it) => {
    const r = losslessResult(it);
    return r?.ok && (r.trimmed.x > 0 || r.trimmed.y > 0);
  });

  const details = (it: Item) => {
    const lines: { text: string; positive?: boolean }[] = [];
    const r = losslessResult(it);
    if (mode === "mirror" && it.kind === "jpeg" && r?.ok && !keepExact) {
      lines.push({ text: fmt(t.list.size, { w: r.width, h: r.height }) }, { text: t.list.lossless, positive: true });
      const n = r.trimmed.x + r.trimmed.y;
      if (n > 0) lines.push({ text: fmt(t.list.trimmed, { n }) });
      return lines;
    }
    const l = mirrorLayout(it.width, it.height, settings);
    const s = fitScale(l.width, l.height, maxOutputPixels());
    lines.push({ text: fmt(t.list.size, { w: Math.max(1, Math.round(l.width * s)), h: Math.max(1, Math.round(l.height * s)) }) });
    if (s < 1) lines.push({ text: t.list.scaled });
    const kind = canvasKind(it);
    if (it.kind === "jpeg") lines.push({ text: kind === "png" ? t.list.pngFade : t.list.reencoded });
    else if (it.kind === "webp" && kind === "png") lines.push({ text: t.list.pngOut });
    return lines;
  };

  const add_ = (files: File[]) => void add(files);
  if (!items.length) return <DropZone t={t} name={t.name} errors={errors} onFiles={add_} />;

  const sides = (keys: Side[]) => keys.map((key) => ({ key, label: t.sides[key] }));
  const label = (it: Item) => `${it.name}: ${t.modes[mode]}`;

  return (
    <section className={shape.tool} id="tool" aria-label={t.name} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <div className={flip.workspace}>
        <ul className={flip.grid} data-single={items.length === 1}>
          {items.map((it) => (
            <li key={it.id} className={flip.card}>
              <div className={flip.thumb}>
                <Preview item={it} settings={settings} label={label(it)} />
              </div>
              {items.length > 1 ? (
                <div className={flip.cardActions}>
                  <button type="button" className={flip.iconButton} aria-label={`${t.output.download} ${it.name}`} disabled={busy} onClick={() => void downloadOne(it)}>
                    <DownloadIcon />
                  </button>
                  <button type="button" className={flip.iconButton} aria-label={fmt(t.list.remove, { name: it.name })} onClick={() => remove(it.id)}>
                    <RemoveIcon />
                  </button>
                </div>
              ) : null}
              <div className={flip.meta}>
                <div className={flip.metaText}>
                  <span className={flip.name} title={it.name}>
                    {it.name}
                  </span>
                  {details(it).map((d) => (
                    <span key={d.text} className={flip.detail} data-tone={d.positive ? "positive" : undefined}>
                      {d.text}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className={flip.panel}>
          <Chips
            legend={t.modes.label}
            name="mirror-mode"
            options={[
              { key: "mirror", label: t.modes.mirror },
              { key: "symmetry", label: t.modes.symmetry },
              { key: "reflection", label: t.modes.reflection },
            ]}
            value={mode}
            onChange={setMode}
          />

          {mode === "mirror" ? (
            <Chips
              legend={t.mirror.label}
              name="mirror-axis"
              options={[
                { key: "h", label: t.mirror.h },
                { key: "v", label: t.mirror.v },
              ]}
              value={axis}
              onChange={setAxis}
            />
          ) : null}

          {mode === "symmetry" ? (
            <>
              <Chips legend={t.symmetry.label} name="mirror-keep" options={sides(["left", "right", "top", "bottom"])} value={keep} onChange={setKeep} />
              <label className={`${shape.field} ${shape.choice}`}>
                <span className={shape.label}>
                  {t.symmetry.line}: {fmt(t.symmetry.lineValue, { n: Math.round(line * 100) })}
                </span>
                <input type="range" min={LINE_MIN * 100} max={LINE_MAX * 100} step={1} value={Math.round(line * 100)} onChange={(e) => setLine(Number(e.target.value) / 100)} />
              </label>
              <p className={flip.hint}>{t.symmetry.hint}</p>
            </>
          ) : null}

          {mode === "reflection" ? (
            <>
              <Chips legend={t.reflection.label} name="mirror-side" options={sides(["bottom", "top", "right", "left"])} value={side} onChange={setSide} />
              <div>
                <label className={flip.check}>
                  <input type="checkbox" checked={fade} onChange={(e) => setFade(e.target.checked)} />
                  <span>{t.reflection.fade}</span>
                </label>
                {fade && items.some((it) => it.kind === "jpeg") ? <p className={flip.hint}>{t.reflection.fadeHint}</p> : null}
              </div>
            </>
          ) : null}

          {mode === "mirror" && (anyTrimmed || keepExact) ? (
            <div>
              <label className={flip.check}>
                <input type="checkbox" checked={keepExact} onChange={(e) => setKeepExact(e.target.checked)} />
                <span>{t.output.keepExact}</span>
              </label>
              <p className={flip.hint}>{t.output.keepExactHint}</p>
            </div>
          ) : null}

          <div className={flip.actions}>
            <button type="button" className={shape.primary} disabled={busy} onClick={() => void (items.length === 1 ? downloadOne(items[0]) : downloadAll())}>
              {busy ? t.output.working : items.length === 1 ? t.output.download : fmt(t.output.downloadZip, { n: items.length })}
            </button>
            <div className={flip.row}>
              {items.length < MAX_FILES ? (
                <label className={flip.addLabel}>
                  <FileInput onFiles={add_} />
                  {t.output.add}
                </label>
              ) : null}
              <button type="button" className={shape.ghost} onClick={clear}>
                {t.output.clear}
              </button>
            </div>
          </div>
          <ErrorList errors={errors} />
        </div>
      </div>
    </section>
  );
}
