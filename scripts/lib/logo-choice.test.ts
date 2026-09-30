import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { logoScore, measureVisibleLogo } from "./logo-choice";

describe("logo choice", () => {
  it("prefers a square icon over a wide wordmark", () => {
    expect(logoScore({ width: 180, height: 180 })).toBeGreaterThan(logoScore({ width: 600, height: 120 }));
  });

  it("penalises favicons too small for the hero tile", () => {
    expect(logoScore({ width: 32, height: 32 })).toBeLessThan(logoScore({ width: 180, height: 180 }));
  });

  it("measures only the visible mark inside transparent padding", async () => {
    const mark = await sharp({ create: { width: 40, height: 10, channels: 4, background: "#123456" } }).png().toBuffer();
    const padded = await sharp({ create: { width: 200, height: 200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: mark, left: 80, top: 95 }]).png().toBuffer();
    expect(await measureVisibleLogo(padded)).toEqual({ width: 40, height: 10 });
  });
});
