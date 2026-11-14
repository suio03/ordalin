// The eight ways to flip and rotate an image by quarter turns, as a 2×2 matrix
// on centred pixel coordinates (x right, y down): output = M · input.
// The canvas renderer and the lossless JPEG transform both read this one value.

export type Orient = readonly [a: number, b: number, c: number, d: number]; // [[a, b], [c, d]]

export const IDENTITY: Orient = [1, 0, 0, 1];
export const FLIP_H: Orient = [-1, 0, 0, 1];
export const FLIP_V: Orient = [1, 0, 0, -1];
export const ROTATE_CW: Orient = [0, -1, 1, 0];
export const ROTATE_CCW: Orient = [0, 1, -1, 0];

/** Apply `next` after `current` (not named `then`: that would make the module namespace thenable). */
export function compose(current: Orient, next: Orient): Orient {
  const [a, b, c, d] = next;
  const [e, f, g, h] = current;
  return [a * e + b * g, a * f + b * h, c * e + d * g, c * f + d * h];
}

export const isIdentity = (o: Orient) => o[0] === 1 && o[3] === 1;
/** True when width and height swap (a quarter turn is involved). */
export const swapsAxes = (o: Orient) => o[0] === 0;

export function outputSize(o: Orient, width: number, height: number) {
  return swapsAxes(o) ? { width: height, height: width } : { width, height };
}

/**
 * Split into steps applied in this order: transpose (swap x and y), then
 * mirror left-right, then mirror top-bottom. Any of the eight is one such combination.
 */
export function decompose(o: Orient): {
  transpose: boolean;
  flipH: boolean;
  flipV: boolean;
} {
  if (!swapsAxes(o))
    return { transpose: false, flipH: o[0] === -1, flipV: o[3] === -1 };
  return { transpose: true, flipH: o[1] === -1, flipV: o[2] === -1 };
}

/** Plain-language name of the change, keyed for UI copy. */
export type OrientName =
  | "none"
  | "flipH"
  | "flipV"
  | "rotate180"
  | "rotateCW"
  | "rotateCCW"
  | "transpose"
  | "transverse";

export function orientName(o: Orient): OrientName {
  const key = o.join(",");
  const names: Record<string, OrientName> = {
    "1,0,0,1": "none",
    "-1,0,0,1": "flipH",
    "1,0,0,-1": "flipV",
    "-1,0,0,-1": "rotate180",
    "0,-1,1,0": "rotateCW",
    "0,1,-1,0": "rotateCCW",
    "0,1,1,0": "transpose",
    "0,-1,-1,0": "transverse",
  };
  return names[key];
}

/** EXIF Orientation tag (1–8) as the matrix that turns stored pixels into the displayed image. */
export function exifOrient(tag: number): Orient {
  switch (tag) {
    case 2:
      return FLIP_H;
    case 3:
      return [-1, 0, 0, -1];
    case 4:
      return FLIP_V;
    case 5:
      return [0, 1, 1, 0];
    case 6:
      return ROTATE_CW;
    case 7:
      return [0, -1, -1, 0];
    case 8:
      return ROTATE_CCW;
    default:
      return IDENTITY;
  }
}

/** Canvas transform for drawing a width×height source so it lands transformed on the output canvas. */
export function canvasTransform(o: Orient, width: number, height: number) {
  const out = outputSize(o, width, height);
  const [a, b, c, d] = o;
  // setTransform(a, b, c, d, e, f) maps x' = a·x + c·y + e, y' = b·x + d·y + f.
  return {
    matrix: [a, c, b, d, out.width / 2, out.height / 2] as const,
    dx: -width / 2,
    dy: -height / 2,
    ...out,
  };
}
