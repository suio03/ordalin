import { webpDimensions } from "./image";

function vp8x(width: number, height: number) {
  const bytes = new Uint8Array(30);
  bytes.set(new TextEncoder().encode("RIFF"), 0);
  bytes.set(new TextEncoder().encode("WEBP"), 8);
  bytes.set(new TextEncoder().encode("VP8X"), 12);
  const w = width - 1;
  const h = height - 1;
  bytes.set([w & 255, (w >> 8) & 255, (w >> 16) & 255], 24);
  bytes.set([h & 255, (h >> 8) & 255, (h >> 16) & 255], 27);
  return bytes;
}

describe("submitted WebP validation", () => {
  it("reads VP8X canvas dimensions", () => {
    expect(webpDimensions(vp8x(512, 320))).toEqual({ width: 512, height: 320 });
  });

  it("rejects bytes that are not WebP", () => {
    expect(webpDimensions(new Uint8Array(40))).toBeNull();
  });
});
