// Pure math shared by the circle crop and square image tools (no DOM, unit tested).
// A crop is a square region of the source image in source pixels: centre + side.

export type Size = { width: number; height: number };
export type Crop = { cx: number; cy: number; side: number };

export const LIMITS = {
  /** Largest upload accepted. */
  mb: 10,
  /** Largest decoded image accepted, in megapixels (protects the visitor's tab). */
  megapixels: 40,
  /** Largest exported side, in pixels. */
  maxOutput: 4096,
  /** Deepest zoom: the crop side never goes below this share of the shorter side. */
  maxZoom: 20,
} as const;

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type InputProblem = "type" | "bytes" | "pixels" | null;

export function checkFile(type: string, bytes: number): InputProblem {
  if (!(ACCEPTED_TYPES as readonly string[]).includes(type)) return "type";
  if (bytes > LIMITS.mb * 1024 * 1024) return "bytes";
  return null;
}

export function checkPixels(size: Size): InputProblem {
  return size.width * size.height > LIMITS.megapixels * 1_000_000 ? "pixels" : null;
}

/**
 * Side limits for a crop. `allowOutside` lets the square grow past the image
 * (circle tool: zoom out and the rest is background); otherwise it stays inside.
 */
export function sideRange(size: Size, allowOutside: boolean) {
  const short = Math.min(size.width, size.height);
  const max = allowOutside ? Math.max(size.width, size.height) : short;
  const min = Math.min(max, Math.max(16, short / LIMITS.maxZoom));
  return { min, max };
}

/** Keeps the side in range and the centre where the image still covers as much of the crop as it can. */
export function clampCrop(crop: Crop, size: Size, allowOutside: boolean): Crop {
  const { min, max } = sideRange(size, allowOutside);
  const side = Math.min(max, Math.max(min, crop.side));
  const axis = (c: number, length: number) => (side <= length ? Math.min(length - side / 2, Math.max(side / 2, c)) : length / 2);
  return { cx: axis(crop.cx, size.width), cy: axis(crop.cy, size.height), side };
}

/** Starting crop: the largest centred square inside the image. */
export function defaultCrop(size: Size): Crop {
  return { cx: size.width / 2, cy: size.height / 2, side: Math.min(size.width, size.height) };
}

/** Moves the crop by a drag of (dx, dy) screen pixels when `scale` screen pixels show one source pixel. */
export function panCrop(crop: Crop, dx: number, dy: number, scale: number, size: Size, allowOutside: boolean): Crop {
  return clampCrop({ ...crop, cx: crop.cx - dx / scale, cy: crop.cy - dy / scale }, size, allowOutside);
}

/**
 * Zooms by `factor` (>1 zooms in) keeping the source point under (px, py) in
 * place; (px, py) are offsets from the stage centre in screen pixels.
 */
export function zoomCrop(crop: Crop, factor: number, px: number, py: number, scale: number, size: Size, allowOutside: boolean): Crop {
  const { min, max } = sideRange(size, allowOutside);
  const side = Math.min(max, Math.max(min, crop.side / factor));
  const real = crop.side / side;
  const newScale = scale * real;
  // Source point under the pointer before and after must match.
  const sx = crop.cx + px / scale;
  const sy = crop.cy + py / scale;
  return clampCrop({ cx: sx - px / newScale, cy: sy - py / newScale, side }, size, allowOutside);
}

/** Zoom as a 0–1 slider value (logarithmic, so each step feels the same). */
export function zoomToSlider(side: number, size: Size, allowOutside: boolean) {
  const { min, max } = sideRange(size, allowOutside);
  if (max <= min) return 0;
  return Math.log(max / side) / Math.log(max / min);
}

export function sliderToSide(value: number, size: Size, allowOutside: boolean) {
  const { min, max } = sideRange(size, allowOutside);
  return max / Math.pow(max / min, Math.min(1, Math.max(0, value)));
}

/** Exported side: the crop's own pixels for "original" (capped), or the preset. */
export function outputSide(choice: "original" | number, naturalSide: number) {
  const side = choice === "original" ? Math.round(naturalSide) : choice;
  return Math.max(1, Math.min(LIMITS.maxOutput, side));
}

/** Where the whole image sits inside an n×n square with `padding` (0–0.4 of the side) on each edge. */
export function fitRect(size: Size, n: number, padding: number) {
  const box = n * (1 - 2 * Math.min(0.4, Math.max(0, padding)));
  const k = box / Math.max(size.width, size.height);
  const width = size.width * k;
  const height = size.height * k;
  return { x: (n - width) / 2, y: (n - height) / 2, width, height };
}

/** The image scaled to cover an n×n square (for the blurred backdrop). */
export function coverRect(size: Size, n: number) {
  const k = n / Math.min(size.width, size.height);
  const width = size.width * k;
  const height = size.height * k;
  return { x: (n - width) / 2, y: (n - height) / 2, width, height };
}
