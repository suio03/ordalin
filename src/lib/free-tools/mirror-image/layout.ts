// Pure layout math for the mirror image tool (no DOM, unit tested).
// A layout is the output size plus a list of source rectangles drawn into it,
// some of them mirrored, and an optional fade over the mirrored copy.

export type MirrorAxis = "h" | "v"; // h = left ↔ right, v = top ↔ bottom
export type Side = "left" | "right" | "top" | "bottom";

export type MirrorSettings =
  | { mode: "mirror"; axis: MirrorAxis }
  /** Keep `keep` up to the line at `line` (0–1 of the width or height) and mirror it across. */
  | { mode: "symmetry"; keep: Side; line: number }
  /** Add a mirrored copy on `side`; `fade` makes it fade out away from the seam. */
  | { mode: "reflection"; side: Side; fade: boolean };

export type Piece = {
  /** Source rectangle. */
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  /** Destination top-left; the destination size equals the source size. */
  dx: number;
  dy: number;
  flip: MirrorAxis | null;
};

/** Linear alpha ramp over a destination rectangle: `from` at (x0, y0) to 0 at (x1, y1). */
export type Fade = { x: number; y: number; w: number; h: number; x0: number; y0: number; x1: number; y1: number; from: number };

export type Layout = { width: number; height: number; pieces: Piece[]; fade: Fade | null };

export const LINE_MIN = 0.1;
export const LINE_MAX = 0.9;
export const FADE_FROM = 0.6;

const horizontal = (s: Side) => s === "left" || s === "right";

export function clampLine(line: number) {
  return Math.min(LINE_MAX, Math.max(LINE_MIN, line));
}

export function mirrorLayout(width: number, height: number, s: MirrorSettings): Layout {
  if (s.mode === "mirror") {
    return { width, height, pieces: [{ sx: 0, sy: 0, sw: width, sh: height, dx: 0, dy: 0, flip: s.axis }], fade: null };
  }

  if (s.mode === "symmetry") {
    const along = horizontal(s.keep) ? width : height;
    const cut = Math.min(along - 1, Math.max(1, Math.round(along * clampLine(s.line))));
    // Kept part: from the kept edge to the line.
    const first = s.keep === "left" || s.keep === "top";
    const start = first ? 0 : cut;
    const size = first ? cut : along - cut;
    const flip: MirrorAxis = horizontal(s.keep) ? "h" : "v";
    // Output: kept part on its own side, its mirror on the other.
    const keptAt = first ? 0 : size;
    const copyAt = first ? size : 0;
    if (horizontal(s.keep)) {
      return {
        width: size * 2,
        height,
        pieces: [
          { sx: start, sy: 0, sw: size, sh: height, dx: keptAt, dy: 0, flip: null },
          { sx: start, sy: 0, sw: size, sh: height, dx: copyAt, dy: 0, flip },
        ],
        fade: null,
      };
    }
    return {
      width,
      height: size * 2,
      pieces: [
        { sx: 0, sy: start, sw: width, sh: size, dx: 0, dy: keptAt, flip: null },
        { sx: 0, sy: start, sw: width, sh: size, dx: 0, dy: copyAt, flip },
      ],
      fade: null,
    };
  }

  // Reflection: the original plus a mirrored copy on `side`, meeting at the seam.
  const h = horizontal(s.side);
  const W = h ? width * 2 : width;
  const H = h ? height : height * 2;
  const copyFirst = s.side === "left" || s.side === "top";
  const orig = { dx: h && copyFirst ? width : 0, dy: !h && copyFirst ? height : 0 };
  const copy = { dx: h && !copyFirst ? width : 0, dy: !h && !copyFirst ? height : 0 };
  const whole = { sx: 0, sy: 0, sw: width, sh: height };
  let fade: Fade | null = null;
  if (s.fade) {
    const r = { x: copy.dx, y: copy.dy, w: width, h: height };
    // From the seam (full `from`) to the far edge (0).
    const seam = s.side === "right" ? { x0: r.x, y0: r.y, x1: r.x + r.w, y1: r.y }
      : s.side === "left" ? { x0: r.x + r.w, y0: r.y, x1: r.x, y1: r.y }
      : s.side === "bottom" ? { x0: r.x, y0: r.y, x1: r.x, y1: r.y + r.h }
      : { x0: r.x, y0: r.y + r.h, x1: r.x, y1: r.y };
    fade = { ...r, ...seam, from: FADE_FROM };
  }
  return {
    width: W,
    height: H,
    pieces: [
      { ...whole, ...orig, flip: null },
      { ...whole, ...copy, flip: h ? "h" : "v" },
    ],
    fade,
  };
}

/** Scale a layout's output down so it stays within `maxPixels` (browser canvas limits). */
export function fitScale(width: number, height: number, maxPixels: number) {
  const area = width * height;
  return area <= maxPixels ? 1 : Math.sqrt(maxPixels / area);
}

export type MirrorName =
  | "mirrorH"
  | "mirrorV"
  | "symLeft"
  | "symRight"
  | "symTop"
  | "symBottom"
  | "refRight"
  | "refLeft"
  | "refBottom"
  | "refTop";

/** Short stable name for analytics and status text. */
export function mirrorName(s: MirrorSettings): MirrorName {
  if (s.mode === "mirror") return s.axis === "h" ? "mirrorH" : "mirrorV";
  const cap = (x: Side) => (x[0].toUpperCase() + x.slice(1)) as Capitalize<Side>;
  if (s.mode === "symmetry") return `sym${cap(s.keep)}`;
  return `ref${cap(s.side)}`;
}
