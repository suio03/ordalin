import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  readDequantized,
  transformJpeg,
  UnsupportedJpeg,
} from "./jpeg-lossless";
import {
  FLIP_H,
  FLIP_V,
  IDENTITY,
  ROTATE_CW,
  compose,
  type Orient,
} from "./orient";

// Fixtures: 33×17 JPEGs from cjpeg; *.ref.jpg are `jpegtran -copy none -trim` outputs.
const fixture = (name: string) =>
  new Uint8Array(readFileSync(path.join(__dirname, "fixtures", name)));

function expectSameImage(actual: Uint8Array, expected: Uint8Array) {
  const a = readDequantized(actual);
  const b = readDequantized(expected);
  expect([a.width, a.height]).toEqual([b.width, b.height]);
  expect(a.components.length).toBe(b.components.length);
  a.components.forEach((c, i) => {
    expect([c.h, c.v]).toEqual([b.components[i].h, b.components[i].v]);
    expect(
      Buffer.from(c.blocks.buffer).equals(
        Buffer.from(b.components[i].blocks.buffer),
      ),
    ).toBe(true);
  });
}

const cases: [string, Orient][] = [
  ["flip-h", FLIP_H],
  ["rotate-90", ROTATE_CW],
  ["transverse", compose(ROTATE_CW, FLIP_V)],
];

describe("transformJpeg", () => {
  for (const file of [
    "420",
    "422-progressive",
    "440-restart",
    "gray-progressive",
  ]) {
    for (const [name, o] of cases) {
      it(`${file} ${name} matches jpegtran`, () => {
        expectSameImage(
          transformJpeg(fixture(`${file}.jpg`), o).bytes,
          fixture(`${file}.${name}.ref.jpg`),
        );
      });
    }
  }

  it("reports the trimmed partial edge", () => {
    // 33 px wide with 16 px MCUs: mirroring left-right drops 1 px.
    expect(transformJpeg(fixture("420.jpg"), FLIP_H).trimmed).toEqual({
      x: 1,
      y: 0,
    });
    expect(transformJpeg(fixture("420.jpg"), IDENTITY).trimmed).toEqual({
      x: 0,
      y: 0,
    });
  });

  it("applies EXIF orientation and resets the tag", () => {
    const out = transformJpeg(fixture("exif6.jpg"), IDENTITY);
    expectSameImage(out.bytes, fixture("exif6.display.ref.jpg"));
    const again = transformJpeg(out.bytes, IDENTITY);
    expectSameImage(again.bytes, out.bytes);
  });

  it("flipping twice gives the original back", () => {
    const once = transformJpeg(fixture("420.jpg"), FLIP_H).bytes;
    const twice = transformJpeg(once, FLIP_H).bytes;
    // 1 px was trimmed on the first flip; after that there is nothing left to trim.
    expect(readDequantized(twice).width).toBe(32);
    expectSameImage(transformJpeg(twice, FLIP_H).bytes, once);
  });

  it("rejects non-JPEG input", () => {
    expect(() =>
      transformJpeg(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), FLIP_H),
    ).toThrow(UnsupportedJpeg);
  });
});
