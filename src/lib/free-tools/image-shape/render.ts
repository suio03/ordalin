// Canvas rendering for the circle crop and square image tools. Everything runs
// in the visitor's browser; nothing is uploaded.
import { coverRect, fitRect, type Crop, type Size } from "./geometry";

export type Fill = { kind: "transparent" } | { kind: "color"; color: string } | { kind: "blur" };
export type Format = "png" | "webp" | "jpeg";

export const MIME: Record<Format, string> = { png: "image/png", webp: "image/webp", jpeg: "image/jpeg" };
export const EXT: Record<Format, string> = { png: "png", webp: "webp", jpeg: "jpg" };

type Source = CanvasImageSource & Size;

function canvas(n: number) {
  const c = document.createElement("canvas");
  c.width = n;
  c.height = n;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return { c, ctx };
}

/** Draws the crop region of the source over an n×n canvas (parts outside the image stay empty). */
function drawCrop(ctx: CanvasRenderingContext2D, img: Source, crop: Crop, n: number) {
  const k = n / crop.side;
  const left = crop.cx - crop.side / 2;
  const top = crop.cy - crop.side / 2;
  ctx.drawImage(img, -left * k, -top * k, img.width * k, img.height * k);
}

export type CircleOptions = { crop: Crop; size: number; background: string | null; border: { width: number; color: string } };

/**
 * Circle crop. Outside the circle is transparent unless `background` is set.
 * `border.width` is a share of the diameter (0–0.05); the border is drawn inside the edge.
 */
export function renderCircle(img: Source, o: CircleOptions) {
  const n = o.size;
  const { c, ctx } = canvas(n);
  if (o.background) {
    ctx.fillStyle = o.background;
    ctx.fillRect(0, 0, n, n);
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(n / 2, n / 2, n / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (o.background) {
    // Inside the circle, where a zoomed-out crop has no image, show the background too.
    ctx.fillRect(0, 0, n, n);
  }
  drawCrop(ctx, img, o.crop, n);
  ctx.restore();
  const bw = Math.round(o.border.width * n);
  if (bw > 0) {
    ctx.beginPath();
    ctx.arc(n / 2, n / 2, n / 2 - bw / 2, 0, Math.PI * 2);
    ctx.lineWidth = bw;
    ctx.strokeStyle = o.border.color;
    ctx.stroke();
  }
  return c;
}

/** A soft blurred copy of the image covering the square, built by scaling down and back up (works in every browser). */
function drawBlur(ctx: CanvasRenderingContext2D, img: Source, n: number) {
  const cover = coverRect(img, n);
  let current: CanvasImageSource = img;
  let w = img.width;
  let h = img.height;
  const target = Math.max(8, Math.round(n / 48));
  // Halve in steps so the downscale averages instead of skipping pixels.
  while (Math.max(w, h) / 2 > target) {
    w = Math.max(1, Math.round(w / 2));
    h = Math.max(1, Math.round(h / 2));
    const step = document.createElement("canvas");
    step.width = w;
    step.height = h;
    const sctx = step.getContext("2d")!;
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(current, 0, 0, w, h);
    current = step;
  }
  // Draw slightly larger so the soft edges fall outside the canvas.
  const grow = 0.08;
  ctx.drawImage(current, cover.x - cover.width * grow, cover.y - cover.height * grow, cover.width * (1 + 2 * grow), cover.height * (1 + 2 * grow));
}

export type SquareOptions =
  | { mode: "fit"; size: number; fill: Fill; padding: number }
  | { mode: "crop"; size: number; crop: Crop };

/** Square image: the whole picture inside a square (fit) or a 1:1 crop. Proportions are always kept. */
export function renderSquare(img: Source, o: SquareOptions) {
  const n = o.size;
  const { c, ctx } = canvas(n);
  if (o.mode === "crop") {
    drawCrop(ctx, img, o.crop, n);
    return c;
  }
  if (o.fill.kind === "color") {
    ctx.fillStyle = o.fill.color;
    ctx.fillRect(0, 0, n, n);
  } else if (o.fill.kind === "blur") {
    drawBlur(ctx, img, n);
  }
  const r = fitRect(img, n, o.padding);
  ctx.drawImage(img, r.x, r.y, r.width, r.height);
  return c;
}

/** JPG has no transparency: paint the canvas onto white first. */
export function flatten(c: HTMLCanvasElement, color = "#ffffff") {
  const { c: out, ctx } = canvas(c.width);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(c, 0, 0);
  return out;
}

export function toBlob(c: HTMLCanvasElement, format: Format, quality = 0.92) {
  return new Promise<Blob>((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed."))), MIME[format], format === "png" ? undefined : quality),
  );
}

export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** "My Photo.final.jpg" → "my-photo-final". */
export function baseName(file: string) {
  const stem = file.replace(/\.[^.]+$/, "");
  const slug = stem.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "image";
}
