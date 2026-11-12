import { describe, expect, it } from "vitest";
import { checkFile, checkPixels, clampCrop, coverRect, defaultCrop, fitRect, outputSide, panCrop, sideRange, sliderToSide, zoomCrop, zoomToSlider } from "./geometry";

const wide = { width: 4000, height: 3000 };

describe("input limits", () => {
  it("accepts JPG, PNG and WebP up to 10 MB", () => {
    expect(checkFile("image/jpeg", 5_000_000)).toBeNull();
    expect(checkFile("image/heic", 1000)).toBe("type");
    expect(checkFile("image/png", 11 * 1024 * 1024)).toBe("bytes");
  });
  it("rejects images over 40 megapixels", () => {
    expect(checkPixels({ width: 12000, height: 9000 })).toBe("pixels");
    expect(checkPixels({ width: 6000, height: 6000 })).toBeNull();
  });
});

describe("crop", () => {
  it("starts with the largest centred square", () => {
    expect(defaultCrop(wide)).toEqual({ cx: 2000, cy: 1500, side: 3000 });
  });
  it("keeps a strict crop inside the image", () => {
    const c = clampCrop({ cx: 0, cy: 0, side: 9000 }, wide, false);
    expect(c).toEqual({ cx: 1500, cy: 1500, side: 3000 });
  });
  it("lets the circle crop zoom out past the image, centred on the overflowing axis", () => {
    const c = clampCrop({ cx: 100, cy: 100, side: 9000 }, wide, true);
    expect(c.side).toBe(4000);
    expect(c.cx).toBe(2000);
    expect(c.cy).toBe(1500);
  });
  it("pans opposite to the image drag, in source pixels", () => {
    const c = panCrop({ cx: 2000, cy: 1500, side: 1000 }, 100, 0, 0.5, wide, false);
    expect(c.cx).toBe(1800);
  });
  it("keeps the point under the pointer fixed while zooming", () => {
    const start = { cx: 2000, cy: 1500, side: 2000 };
    const scale = 0.25;
    const px = 100;
    const py = -50;
    const before = { x: start.cx + px / scale, y: start.cy + py / scale };
    const z = zoomCrop(start, 2, px, py, scale, wide, false);
    const newScale = scale * (start.side / z.side);
    expect(z.side).toBe(1000);
    expect(z.cx + px / newScale).toBeCloseTo(before.x);
    expect(z.cy + py / newScale).toBeCloseTo(before.y);
  });
  it("maps the zoom slider both ways", () => {
    const { min, max } = sideRange(wide, false);
    expect(sliderToSide(0, wide, false)).toBeCloseTo(max);
    expect(sliderToSide(1, wide, false)).toBeCloseTo(min);
    expect(zoomToSlider(sliderToSide(0.4, wide, false), wide, false)).toBeCloseTo(0.4);
  });
});

describe("output", () => {
  it("uses the crop's own pixels for original, capped at 4096", () => {
    expect(outputSide("original", 2999.6)).toBe(3000);
    expect(outputSide("original", 6000)).toBe(4096);
    expect(outputSide(1080, 200)).toBe(1080);
  });
  it("fits the whole image without stretching", () => {
    const r = fitRect(wide, 1000, 0);
    expect(r.width).toBe(1000);
    expect(r.height).toBe(750);
    expect(r.width / r.height).toBeCloseTo(4000 / 3000);
    expect(r.y).toBe(125);
    const padded = fitRect(wide, 1000, 0.1);
    expect(padded.width).toBe(800);
  });
  it("covers the square for the blurred backdrop", () => {
    const r = coverRect(wide, 1000);
    expect(r.height).toBe(1000);
    expect(r.width).toBeCloseTo(1333.33, 1);
  });
});
