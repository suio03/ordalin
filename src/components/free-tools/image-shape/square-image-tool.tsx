"use client";

import { useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { en, type ImageShapeCopy } from "@/lib/free-tools/image-shape/copy";
import { clampCrop, defaultCrop, outputSide } from "@/lib/free-tools/image-shape/geometry";
import { baseName, renderSquare, type Fill, type Format, type SquareOptions } from "@/lib/free-tools/image-shape/render";
import { CanvasView, ColorChoice, CropStage, ImageDrop, OutputControls, exportCanvas, useCrop, useImageFile, type SizeChoice } from "./shared";
import styles from "./image-shape.module.css";

type Mode = "fit" | "crop";
type FillKey = "blur" | "white" | "black" | "transparent" | "custom";
const PRESETS = [1080, 2048, 3000];
const PREVIEW = 720;

export function SquareImageTool({ t = en }: { t?: ImageShapeCopy }) {
  const { loaded, error, load, clear, setError } = useImageFile(t);
  const [mode, setMode] = useState<Mode>("fit");
  const [crop, setCrop] = useCrop(loaded);
  const [fillKey, setFillKey] = useState<FillKey>("blur");
  const [custom, setCustom] = useState("#f2c94c");
  const [padding, setPadding] = useState(0);
  const [sizeChoice, setSizeChoice] = useState<SizeChoice>("original");
  const [format, setFormat] = useState<Format>("png");
  const [busy, setBusy] = useState(false);

  const fill: Fill = useMemo(() => {
    if (fillKey === "blur") return { kind: "blur" };
    if (fillKey === "transparent") return { kind: "transparent" };
    return { kind: "color", color: fillKey === "white" ? "#ffffff" : fillKey === "black" ? "#000000" : custom };
  }, [fillKey, custom]);

  const naturalSide = loaded ? (mode === "fit" ? Math.max(loaded.size.width, loaded.size.height) : (crop?.side ?? 0)) : 0;
  const optionsFor = (size: number): SquareOptions | null => {
    if (mode === "fit") return { mode, size, fill, padding: padding / 100 };
    return crop ? { mode, size, crop } : null;
  };
  // Fit mode previews the full result; crop mode shows the interactive stage instead.
  const preview = useMemo(
    () => (loaded && mode === "fit" ? renderSquare(loaded.img, { mode, size: PREVIEW, fill, padding: padding / 100 }) : null),
    [loaded, mode, fill, padding],
  );

  if (!loaded || !crop) {
    return (
      <div className={styles.tool}>
        <ImageDrop t={t} onFile={load} error={error} />
      </div>
    );
  }

  const download = async () => {
    const o = optionsFor(outputSide(sizeChoice, naturalSide));
    if (!o) return;
    setBusy(true);
    try {
      await exportCanvas(renderSquare(loaded.img, o), format, `${baseName(loaded.name)}-square`);
      trackEvent("Square Image Download", { mode, fill: mode === "fit" ? fillKey : "none", format, size: String(sizeChoice) });
    } catch {
      setError(t.errors.export);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.tool}>
      <fieldset className={styles.modes}>
        <legend className={styles.srOnly}>{t.square.mode}</legend>
        {(["fit", "crop"] as const).map((m) => (
          <label key={m} className={styles.mode}>
            <input type="radio" name="square-mode" checked={mode === m} onChange={() => setMode(m)} />
            <span>
              <strong>{m === "fit" ? t.square.fit : t.square.crop}</strong>
              <small>{m === "fit" ? t.square.fitHint : t.square.cropHint}</small>
            </span>
          </label>
        ))}
      </fieldset>
      <div className={styles.workspace}>
        <div>
          {mode === "fit" ? (
            <CanvasView source={preview} className={styles.fitView} label={t.output.preview} />
          ) : (
            <CropStage
              t={t}
              img={loaded.img}
              size={loaded.size}
              crop={crop}
              onCrop={(c) => setCrop(clampCrop(c, loaded.size, false))}
              shape="square"
              allowOutside={false}
              onReset={() => setCrop(defaultCrop(loaded.size))}
            />
          )}
          <button type="button" className={styles.secondary} onClick={clear}>
            {t.stage.replace}
          </button>
        </div>
        <div className={styles.panel}>
          {mode === "fit" ? (
            <>
              <ColorChoice
                t={t}
                legend={t.square.fill}
                options={[
                  { key: "blur", label: t.square.blur },
                  { key: "white", label: t.colors.white, swatch: "white" },
                  { key: "black", label: t.colors.black, swatch: "black" },
                  { key: "transparent", label: t.colors.transparent, swatch: "transparent" },
                ]}
                value={fillKey}
                onChange={setFillKey}
                custom={custom}
                onCustom={setCustom}
              />
              <label className={`${styles.field} ${styles.choice}`}>
                <span className={styles.label}>
                  {t.square.padding}: {padding}%
                </span>
                <input type="range" min={0} max={20} step={1} value={padding} onChange={(e) => setPadding(Number(e.target.value))} />
              </label>
            </>
          ) : null}
          <OutputControls
            t={t}
            presets={PRESETS}
            naturalSide={naturalSide}
            sizeChoice={sizeChoice}
            onSize={setSizeChoice}
            format={format}
            onFormat={setFormat}
            transparent={mode === "fit" && fillKey === "transparent"}
            busy={busy}
            onDownload={download}
          />
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
