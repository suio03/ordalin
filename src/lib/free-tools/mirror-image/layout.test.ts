import { describe, expect, it } from "vitest";
import { fitScale, mirrorLayout, mirrorName, type Layout } from "./layout";

/** Paint a layout onto a 1-channel pixel grid, reading src(x, y). */
function paint(l: Layout, src: (x: number, y: number) => number) {
  const out: number[][] = Array.from({ length: l.height }, () => Array(l.width).fill(-1));
  for (const p of l.pieces) {
    for (let y = 0; y < p.sh; y++) {
      for (let x = 0; x < p.sw; x++) {
        const fx = p.flip === "h" ? p.sw - 1 - x : x;
        const fy = p.flip === "v" ? p.sh - 1 - y : y;
        out[p.dy + y][p.dx + x] = src(p.sx + fx, p.sy + fy);
      }
    }
  }
  return out;
}

const W = 10;
const H = 6;
const src = (x: number, y: number) => y * 100 + x;

describe("mirrorLayout", () => {
  it("mirror h/v keeps the size and flips", () => {
    const h = paint(mirrorLayout(W, H, { mode: "mirror", axis: "h" }), src);
    expect(h[2][0]).toBe(src(W - 1, 2));
    const v = paint(mirrorLayout(W, H, { mode: "mirror", axis: "v" }), src);
    expect(v[0][3]).toBe(src(3, H - 1));
  });

  it("symmetry at the centre is symmetric and covers every pixel", () => {
    for (const keep of ["left", "right"] as const) {
      const l = mirrorLayout(W, H, { mode: "symmetry", keep, line: 0.5 });
      expect([l.width, l.height]).toEqual([W, H]);
      const g = paint(l, src);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        expect(g[y][x]).toBe(g[y][W - 1 - x]);
        expect(g[y][x]).toBeGreaterThanOrEqual(0);
      }
    }
    for (const keep of ["top", "bottom"] as const) {
      const g = paint(mirrorLayout(W, H, { mode: "symmetry", keep, line: 0.5 }), src);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) expect(g[y][x]).toBe(g[H - 1 - y][x]);
    }
  });

  it("symmetry with an off-centre line keeps the chosen part unchanged", () => {
    const left = mirrorLayout(W, H, { mode: "symmetry", keep: "left", line: 0.3 });
    expect(left.width).toBe(6);
    const g = paint(left, src);
    expect(g[1].slice(0, 3)).toEqual([src(0, 1), src(1, 1), src(2, 1)]);
    expect(g[1].slice(3)).toEqual([src(2, 1), src(1, 1), src(0, 1)]);

    const right = mirrorLayout(W, H, { mode: "symmetry", keep: "right", line: 0.3 });
    expect(right.width).toBe(14);
    const r = paint(right, src);
    expect(r[0][7]).toBe(src(3, 0)); // kept part starts at the line
    expect(r[0][13]).toBe(src(9, 0));
    expect(r[0][0]).toBe(src(9, 0));
  });

  it("symmetry clamps the line to 10–90%", () => {
    expect(mirrorLayout(W, H, { mode: "symmetry", keep: "left", line: 0 }).width).toBe(2);
    expect(mirrorLayout(W, H, { mode: "symmetry", keep: "left", line: 1 }).width).toBe(18);
  });

  it("reflection doubles the size, the copy is an exact mirror", () => {
    const b = mirrorLayout(W, H, { mode: "reflection", side: "bottom", fade: false });
    expect([b.width, b.height]).toEqual([W, H * 2]);
    const g = paint(b, src);
    for (let y = 0; y < H; y++) expect(g[H + y][4]).toBe(src(4, H - 1 - y));
    expect(g[0][0]).toBe(src(0, 0));

    const l = mirrorLayout(W, H, { mode: "reflection", side: "left", fade: false });
    expect([l.width, l.height]).toEqual([W * 2, H]);
    const gl = paint(l, src);
    expect(gl[2][W]).toBe(src(0, 2)); // original on the right
    expect(gl[2][W - 1]).toBe(src(0, 2)); // seam mirrors
  });

  it("reflection fade runs from the seam to the far edge of the copy", () => {
    const b = mirrorLayout(W, H, { mode: "reflection", side: "bottom", fade: true });
    expect(b.fade).toMatchObject({ x: 0, y: H, w: W, h: H, x0: 0, y0: H, x1: 0, y1: H * 2 });
    const t = mirrorLayout(W, H, { mode: "reflection", side: "top", fade: true });
    expect(t.fade).toMatchObject({ y: 0, y0: H, y1: 0 });
    expect(mirrorLayout(W, H, { mode: "reflection", side: "top", fade: false }).fade).toBeNull();
  });

  it("names and fit scale", () => {
    expect(mirrorName({ mode: "symmetry", keep: "right", line: 0.5 })).toBe("symRight");
    expect(mirrorName({ mode: "reflection", side: "bottom", fade: true })).toBe("refBottom");
    expect(fitScale(100, 100, 20_000)).toBe(1);
    expect(fitScale(200, 200, 10_000)).toBeCloseTo(0.5);
  });
});
