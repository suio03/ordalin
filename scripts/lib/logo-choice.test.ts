import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { brandStems, declaredIconUrls, icoToPng, isBlankTile, logoScore, logoUrlPrior, measureVisibleLogo } from "./logo-choice";

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

  it("rejects blank tiles but keeps single-color silhouettes", async () => {
    const tile = await sharp({ create: { width: 180, height: 180, channels: 4, background: "#fdfcf9" } }).png().toBuffer();
    const ring = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><circle cx="90" cy="90" r="70" fill="none" stroke="#000" stroke-width="20"/></svg>');
    const marked = await sharp(tile).composite([{ input: ring }]).png().toBuffer();
    expect(await isBlankTile(tile)).toBe(true);
    expect(await isBlankTile(marked)).toBe(false);
    expect(await isBlankTile(await sharp(ring).png().toBuffer())).toBe(false);
  });

  const context = { declared: new Set(["https://example.com/favicon-256.png"]), brands: brandStems("Example AI", "example-ai", "https://www.example.com/") };

  it("ranks illustration-like images below declared icons", () => {
    expect(logoUrlPrior("https://cdn.example.com/images/Frame_2147221978.png?w=1248", context)).toBeLessThan(0.5);
    expect(logoUrlPrior("https://example.com/og-image.png", context)).toBeLessThan(0.5);
    expect(logoUrlPrior("https://example.com/favicon-256.png", context)).toBe(1);
  });

  it("trusts undeclared images only when they carry the brand", () => {
    expect(logoUrlPrior("https://cdn.site-files.com/abc/example-logo.svg", context)).toBe(1);
    expect(logoUrlPrior("https://example.com/_next/image?url=%2Fexample-mark.png&w=256", context)).toBe(1);
    expect(logoUrlPrior("https://example.com/img/integrations/windows.svg", context)).toBeLessThan(0.5);
    expect(logoUrlPrior("https://cdn.site-files.com/abc/customers/siro-logo.svg", context)).toBeLessThan(0.5);
    expect(logoUrlPrior("https://blob.example.net/example-ai/logo-carousel/chicagobooth.svg", context)).toBeLessThan(0.5);
  });

  it("reads icon and apple-touch-icon links but not other link tags", () => {
    const html = `<link rel="stylesheet" href="/a.css"><link data-x rel="shortcut icon" sizes="256x256" href="https://cdn.example.com/icon-256.png">
      <link rel="apple-touch-icon" href="/apple.png?v=1&amp;x=2"><link rel="mask-icon" href="/pinned.svg">`;
    expect(declaredIconUrls(html, "https://example.com/")).toEqual(["https://cdn.example.com/icon-256.png", "https://example.com/apple.png?v=1&x=2"]);
  });

  it("extracts the largest PNG entry from an ICO file", async () => {
    const png = (size: number) => sharp({ create: { width: size, height: size, channels: 4, background: "#123456" } }).png().toBuffer();
    const images = [await png(16), await png(64)];
    const header = Buffer.alloc(6 + images.length * 16);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(images.length, 4);
    let offset = header.length;
    images.forEach((image, index) => {
      const entry = 6 + index * 16;
      header[entry] = index ? 64 : 16;
      header[entry + 1] = index ? 64 : 16;
      header.writeUInt32LE(image.length, entry + 8);
      header.writeUInt32LE(offset, entry + 12);
      offset += image.length;
    });
    const decoded = await icoToPng(Buffer.concat([header, ...images]));
    expect((await sharp(decoded!).metadata()).width).toBe(64);
  });

  it("decodes 32-bit BMP entries in an ICO file", async () => {
    const size = 2;
    const dib = Buffer.alloc(40 + size * size * 4 + size * 4);
    dib.writeUInt32LE(40, 0);
    dib.writeInt32LE(size, 4);
    dib.writeInt32LE(size * 2, 8);
    dib.writeUInt16LE(1, 12);
    dib.writeUInt16LE(32, 14);
    for (let pixel = 0; pixel < size * size; pixel += 1) dib.set([0x56, 0x34, 0x12, 0xff], 40 + pixel * 4);
    const header = Buffer.alloc(22);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(1, 4);
    header[6] = size;
    header.writeUInt32LE(dib.length, 14);
    header.writeUInt32LE(22, 18);
    const { data, info } = await sharp((await icoToPng(Buffer.concat([header, dib])))!).raw().toBuffer({ resolveWithObject: true });
    expect(info.width).toBe(size);
    expect([...data.subarray(0, 4)]).toEqual([0x12, 0x34, 0x56, 0xff]);
  });

  it("ignores bytes that are not an ICO file", async () => {
    expect(await icoToPng(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0]))).toBeNull();
  });
});
