"use client";

import { useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { en, type ImageShapeCopy } from "@/lib/free-tools/image-shape/copy";
import { clampCrop, defaultCrop, outputSide } from "@/lib/free-tools/image-shape/geometry";
import { baseName, renderCircle, type Format } from "@/lib/free-tools/image-shape/render";
import { ColorChoice, CropStage, ImageDrop, OutputControls, Previews, exportCanvas, useCrop, useImageFile, type SizeChoice } from "./shared";
import styles from "./image-shape.module.css";

type Bg = "transparent" | "white" | "black" | "custom";
const BG_COLOR: Record<Exclude<Bg, "transparent" | "custom">, string> = { white: "#ffffff", black: "#000000" };
const PRESETS = [512, 1080, 2048];
const PREVIEW = 360;

export function CircleCropTool({ t = en }: { t?: ImageShapeCopy }) {
  const { loaded, error, load, clear, setError } = useImageFile(t);
  const [crop, setCrop] = useCrop(loaded);
  const [bg, setBg] = useState<Bg>("transparent");
  const [custom, setCustom] = useState("#f2c94c");
  const [border, setBorder] = useState(0);
  const [borderColor, setBorderColor] = useState("#ffffff");
  const [sizeChoice, setSizeChoice] = useState<SizeChoice>("original");
  const [format, setFormat] = useState<Format>("png");
  const [busy, setBusy] = useState(false);

  const background = bg === "transparent" ? null : bg === "custom" ? custom : BG_COLOR[bg];
  const options = useMemo(
    () => (crop ? { crop, background, border: { width: border / 100, color: borderColor } } : null),
    [crop, background, border, borderColor],
  );
  const preview = useMemo(() => (loaded && options ? renderCircle(loaded.img, { ...options, size: PREVIEW }) : null), [loaded, options]);

  if (!loaded || !crop || !options) {
    return (
      <div className={styles.tool}>
        <ImageDrop t={t} onFile={load} error={error} />
      </div>
    );
  }

  const download = async () => {
    setBusy(true);
    try {
      const size = outputSide(sizeChoice, crop.side);
      const c = renderCircle(loaded.img, { ...options, size });
      await exportCanvas(c, format, `${baseName(loaded.name)}-circle`);
      trackEvent("Circle Crop Download", { format, background: bg, border: border > 0 ? "yes" : "no", size: String(sizeChoice) });
    } catch {
      setError(t.errors.export);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.tool}>
      <div className={styles.workspace}>
        <div>
          <CropStage
            t={t}
            img={loaded.img}
            size={loaded.size}
            crop={crop}
            onCrop={(c) => setCrop(clampCrop(c, loaded.size, true))}
            shape="circle"
            allowOutside
            onReset={() => setCrop(defaultCrop(loaded.size))}
          />
          <button type="button" className={styles.secondary} onClick={clear}>
            {t.stage.replace}
          </button>
        </div>
        <div className={styles.panel}>
          <ColorChoice
            t={t}
            legend={t.circle.background}
            options={[
              { key: "transparent", label: t.colors.transparent, swatch: "transparent" },
              { key: "white", label: t.colors.white, swatch: "white" },
              { key: "black", label: t.colors.black, swatch: "black" },
            ]}
            value={bg}
            onChange={setBg}
            custom={custom}
            onCustom={setCustom}
          />
          <div className={styles.choice}>
            <label className={styles.field}>
              <span className={styles.label}>
                {t.circle.borderWidth}: {border === 0 ? t.circle.borderNone : `${border}%`}
              </span>
              <input type="range" min={0} max={5} step={0.5} value={border} onChange={(e) => setBorder(Number(e.target.value))} />
            </label>
            {border > 0 ? (
              <label className={styles.inlineField}>
                <input type="color" className={styles.colorInput} value={borderColor} onChange={(e) => setBorderColor(e.target.value)} />
                <span>{t.circle.borderColor}</span>
              </label>
            ) : null}
          </div>
          <Previews t={t} source={preview} />
          <OutputControls
            t={t}
            presets={PRESETS}
            naturalSide={crop.side}
            sizeChoice={sizeChoice}
            onSize={setSizeChoice}
            format={format}
            onFormat={setFormat}
            transparent={background === null}
            busy={busy}
            onDownload={download}
          />
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
