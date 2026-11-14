// Lossless JPEG flip and rotate, in the browser, without decoding to pixels.
//
// A JPEG stores 8×8 blocks of DCT coefficients. Mirroring or turning the image
// by quarter turns only moves those blocks and flips the sign of some
// coefficients, so the stored data can be rearranged and written back without
// a new round of compression: the same thing `jpegtran` does. Supported input:
// 8-bit Huffman-coded baseline, extended and progressive JPEGs (practically
// every camera, phone and web JPEG). Output is sequential with optimized
// Huffman tables; quantization tables, chroma subsampling, ICC profile, EXIF
// and other metadata are kept. The EXIF Orientation tag is folded into the
// transform and reset to 1, so the result looks the same in every viewer.
//
// One limit, shared with jpegtran: blocks are grouped into MCUs of 8 or 16
// pixels. When an edge that moves to the other side isn't a whole number of
// MCUs, that partial strip can't be moved losslessly, so it is trimmed (at
// most 15 px). `trimmed` in the result reports it.

import { compose, decompose, exifOrient, type Orient } from "./orient";

export class UnsupportedJpeg extends Error {}

const ZIGZAG = new Int32Array([
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40,
  48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28, 35, 42, 49, 56, 57, 50, 43, 36, 29,
  22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54,
  47, 55, 62, 63,
]);

type Huffman = {
  maxcode: Int32Array;
  valptr: Int32Array;
  mincode: Int32Array;
  values: Uint8Array;
};

type Component = {
  id: number;
  h: number;
  v: number;
  tq: number;
  blocksPerLine: number;
  blocksPerColumn: number;
  blocksPerLineForMcu: number;
  blocksPerColumnForMcu: number;
  data: Int16Array;
  pred: number;
  dc?: Huffman;
  ac?: Huffman;
};

type Frame = {
  width: number;
  height: number;
  progressive: boolean;
  hmax: number;
  vmax: number;
  mcusPerLine: number;
  mcusPerColumn: number;
  components: Component[];
};

type Segment = { marker: number; bytes: Uint8Array };

function buildHuffman(counts: Uint8Array, values: Uint8Array): Huffman {
  const maxcode = new Int32Array(18).fill(-1);
  const valptr = new Int32Array(17);
  const mincode = new Int32Array(17);
  let code = 0;
  let k = 0;
  for (let len = 1; len <= 16; len++) {
    const n = counts[len - 1];
    if (n) {
      valptr[len] = k;
      mincode[len] = code;
      code += n;
      k += n;
      maxcode[len] = code - 1;
    }
    code <<= 1;
  }
  maxcode[17] = 0x7fffffff;
  return { maxcode, valptr, mincode, values };
}

const u16 = (d: Uint8Array, o: number) => (d[o] << 8) | d[o + 1];

/** Splits the file into segments and decodes every scan into the coefficient arrays. */
function decode(data: Uint8Array) {
  if (data[0] !== 0xff || data[1] !== 0xd8)
    throw new UnsupportedJpeg("Not a JPEG file");
  let offset = 2;
  let frame: Frame | null = null;
  let resetInterval = 0;
  const dcTables: Huffman[] = [];
  const acTables: Huffman[] = [];
  const quant: Segment[] = [];
  const keep: Segment[] = [];
  let quant16 = false;

  while (offset < data.length) {
    if (data[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = data[offset + 1];
    if (marker === 0xff) {
      offset++;
      continue;
    }
    offset += 2;
    if (marker === 0xd9) break; // EOI
    if (
      marker === 0xd8 ||
      (marker >= 0xd0 && marker <= 0xd7) ||
      marker === 0x01
    )
      continue;
    const length = u16(data, offset);
    const body = data.subarray(offset + 2, offset + length);
    const seg = { marker, bytes: data.subarray(offset - 2, offset + length) };
    offset += length;

    if ((marker >= 0xe0 && marker <= 0xef) || marker === 0xfe) {
      keep.push(seg);
    } else if (marker === 0xdb) {
      quant.push(seg);
      for (let p = 0; p < body.length;) {
        const pq = body[p] >> 4;
        if (pq) quant16 = true;
        p += 1 + 64 * (pq ? 2 : 1);
      }
    } else if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      if (body[0] !== 8)
        throw new UnsupportedJpeg("Only 8-bit JPEGs are supported");
      const height = u16(body, 1);
      const width = u16(body, 3);
      if (!width || !height) throw new UnsupportedJpeg("Missing image size");
      const n = body[5];
      if (n < 1 || n > 4)
        throw new UnsupportedJpeg("Unsupported component count");
      const comps: Component[] = [];
      for (let i = 0; i < n; i++) {
        const p = 6 + i * 3;
        const h = body[p + 1] >> 4;
        const v = body[p + 1] & 15;
        if (!h || !v || h > 4 || v > 4)
          throw new UnsupportedJpeg("Bad sampling factors");
        comps.push({
          id: body[p],
          h,
          v,
          tq: body[p + 2],
          blocksPerLine: 0,
          blocksPerColumn: 0,
          blocksPerLineForMcu: 0,
          blocksPerColumnForMcu: 0,
          data: new Int16Array(0),
          pred: 0,
        });
      }
      const hmax = Math.max(...comps.map((c) => c.h));
      const vmax = Math.max(...comps.map((c) => c.v));
      const mcusPerLine = Math.ceil(width / (8 * hmax));
      const mcusPerColumn = Math.ceil(height / (8 * vmax));
      for (const c of comps) {
        c.blocksPerLine = Math.ceil(Math.ceil((width * c.h) / hmax) / 8);
        c.blocksPerColumn = Math.ceil(Math.ceil((height * c.v) / vmax) / 8);
        c.blocksPerLineForMcu = mcusPerLine * c.h;
        c.blocksPerColumnForMcu = mcusPerColumn * c.v;
        c.data = new Int16Array(
          c.blocksPerLineForMcu * c.blocksPerColumnForMcu * 64,
        );
      }
      frame = {
        width,
        height,
        progressive: marker === 0xc2,
        hmax,
        vmax,
        mcusPerLine,
        mcusPerColumn,
        components: comps,
      };
    } else if (
      [
        0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcc, 0xcd, 0xce, 0xcf,
      ].includes(marker)
    ) {
      throw new UnsupportedJpeg(
        "Lossless, hierarchical or arithmetic-coded JPEG",
      );
    } else if (marker === 0xc4) {
      for (let p = 0; p < body.length;) {
        const tc = body[p] >> 4;
        const th = body[p] & 15;
        const counts = body.subarray(p + 1, p + 17);
        let total = 0;
        for (let i = 0; i < 16; i++) total += counts[i];
        const table = buildHuffman(counts, body.slice(p + 17, p + 17 + total));
        (tc ? acTables : dcTables)[th] = table;
        p += 17 + total;
      }
    } else if (marker === 0xdd) {
      resetInterval = u16(body, 0);
    } else if (marker === 0xda) {
      if (!frame) throw new UnsupportedJpeg("Scan before frame header");
      const ns = body[0];
      const scanComps: Component[] = [];
      for (let i = 0; i < ns; i++) {
        const c = frame.components.find((x) => x.id === body[1 + i * 2]);
        if (!c) throw new UnsupportedJpeg("Unknown component in scan");
        const t = body[2 + i * 2];
        c.dc = dcTables[t >> 4];
        c.ac = acTables[t & 15];
        scanComps.push(c);
      }
      const p = 1 + ns * 2;
      offset = decodeScan(
        data,
        offset,
        frame,
        scanComps,
        resetInterval,
        body[p],
        body[p + 1],
        body[p + 2] >> 4,
        body[p + 2] & 15,
      );
    }
    // Other markers (DNL, JPG extensions) carry nothing we need.
  }
  if (!frame) throw new UnsupportedJpeg("No frame header");
  return { frame, quant, keep, quant16 };
}

function decodeScan(
  data: Uint8Array,
  start: number,
  frame: Frame,
  comps: Component[],
  resetInterval: number,
  spectralStart: number,
  spectralEnd: number,
  successivePrev: number,
  successive: number,
): number {
  let offset = start;
  let bitsData = 0;
  let bitsCount = 0;
  let eobrun = 0;
  let acState = 0;
  let acNext = 0;

  const readBit = () => {
    if (bitsCount > 0) {
      bitsCount--;
      return (bitsData >> bitsCount) & 1;
    }
    bitsData = data[offset++] ?? 0;
    if (bitsData === 0xff) {
      const next = data[offset];
      if (next === 0) offset++;
      else {
        // Hit a marker: the data ran short. Feed zeros, like libjpeg, and stay on the marker.
        offset--;
        bitsData = 0;
      }
    }
    bitsCount = 7;
    return bitsData >>> 7;
  };
  const decodeHuffman = (t: Huffman | undefined) => {
    if (!t) throw new UnsupportedJpeg("Missing Huffman table");
    let code = 0;
    for (let len = 1; len <= 16; len++) {
      code = (code << 1) | readBit();
      if (code <= t.maxcode[len])
        return t.values[t.valptr[len] + code - t.mincode[len]];
    }
    return 0; // corrupt data; continue with zeros
  };
  const receive = (n: number) => {
    let v = 0;
    while (n-- > 0) v = (v << 1) | readBit();
    return v;
  };
  const extend = (n: number) => {
    if (n === 1) return readBit() ? 1 : -1;
    const v = receive(n);
    return v >= 1 << (n - 1) ? v : v + (-1 << n) + 1;
  };

  type Decoder = (c: Component, o: number) => void;
  const baseline: Decoder = (c, o) => {
    const t = decodeHuffman(c.dc);
    c.pred += t === 0 ? 0 : extend(t);
    c.data[o] = c.pred;
    for (let k = 1; k < 64;) {
      const rs = decodeHuffman(c.ac);
      const s = rs & 15;
      const r = rs >> 4;
      if (s === 0) {
        if (r < 15) break;
        k += 16;
        continue;
      }
      k += r;
      if (k > 63) break;
      c.data[o + ZIGZAG[k]] = extend(s);
      k++;
    }
  };
  const dcFirst: Decoder = (c, o) => {
    const t = decodeHuffman(c.dc);
    c.pred += t === 0 ? 0 : extend(t) * (1 << successive);
    c.data[o] = c.pred;
  };
  const dcRefine: Decoder = (c, o) => {
    if (readBit()) c.data[o] |= 1 << successive;
  };
  const acFirst: Decoder = (c, o) => {
    if (eobrun > 0) {
      eobrun--;
      return;
    }
    for (let k = spectralStart; k <= spectralEnd;) {
      const rs = decodeHuffman(c.ac);
      const s = rs & 15;
      const r = rs >> 4;
      if (s === 0) {
        if (r < 15) {
          eobrun = receive(r) + (1 << r) - 1;
          break;
        }
        k += 16;
        continue;
      }
      k += r;
      if (k > 63) break;
      c.data[o + ZIGZAG[k]] = extend(s) * (1 << successive);
      k++;
    }
  };
  const acRefine: Decoder = (c, o) => {
    let r = 0;
    const d = c.data;
    for (let k = spectralStart; k <= spectralEnd; k++) {
      const z = o + ZIGZAG[k];
      const sign = d[z] < 0 ? -1 : 1;
      switch (acState) {
        case 0: {
          const rs = decodeHuffman(c.ac);
          const s = rs & 15;
          r = rs >> 4;
          if (s === 0) {
            if (r < 15) {
              eobrun = receive(r) + (1 << r);
              acState = 4;
            } else {
              r = 16;
              acState = 1;
            }
          } else {
            acNext = extend(s);
            acState = r ? 2 : 3;
          }
          k--; // re-examine this coefficient in the new state
          continue;
        }
        case 1:
        case 2:
          if (d[z]) d[z] += sign * (readBit() << successive);
          else {
            r--;
            if (r === 0) acState = acState === 2 ? 3 : 0;
          }
          break;
        case 3:
          if (d[z]) d[z] += sign * (readBit() << successive);
          else {
            d[z] = acNext * (1 << successive);
            acState = 0;
          }
          break;
        case 4:
          if (d[z]) d[z] += sign * (readBit() << successive);
          break;
      }
    }
    if (acState === 4) {
      eobrun--;
      if (eobrun === 0) acState = 0;
    }
  };

  let decodeFn: Decoder;
  if (!frame.progressive) decodeFn = baseline;
  else if (spectralStart === 0)
    decodeFn = successivePrev === 0 ? dcFirst : dcRefine;
  else decodeFn = successivePrev === 0 ? acFirst : acRefine;

  const single = comps.length === 1;
  const total = single
    ? comps[0].blocksPerLine * comps[0].blocksPerColumn
    : frame.mcusPerLine * frame.mcusPerColumn;
  let mcu = 0;
  while (mcu < total) {
    const count = resetInterval ? Math.min(total - mcu, resetInterval) : total;
    for (const c of comps) c.pred = 0;
    eobrun = 0;
    acState = 0;
    bitsCount = 0;
    if (single) {
      const c = comps[0];
      for (let n = 0; n < count; n++, mcu++) {
        const row = Math.floor(mcu / c.blocksPerLine);
        const col = mcu % c.blocksPerLine;
        decodeFn(c, 64 * (row * c.blocksPerLineForMcu + col));
      }
    } else {
      for (let n = 0; n < count; n++, mcu++) {
        const mr = Math.floor(mcu / frame.mcusPerLine);
        const mc = mcu % frame.mcusPerLine;
        for (const c of comps) {
          for (let j = 0; j < c.v; j++) {
            for (let i = 0; i < c.h; i++) {
              decodeFn(
                c,
                64 * ((mr * c.v + j) * c.blocksPerLineForMcu + mc * c.h + i),
              );
            }
          }
        }
      }
    }
    // Move to the next marker; consume restart markers between intervals.
    bitsCount = 0;
    while (
      offset < data.length - 1 &&
      !(
        data[offset] === 0xff &&
        data[offset + 1] !== 0 &&
        data[offset + 1] !== 0xff
      )
    )
      offset++;
    const m = data[offset + 1];
    if (m >= 0xd0 && m <= 0xd7) {
      offset += 2;
      continue;
    }
    break;
  }
  // Leave the offset on the next marker.
  while (
    offset < data.length - 1 &&
    !(
      data[offset] === 0xff &&
      data[offset + 1] !== 0 &&
      data[offset + 1] !== 0xff &&
      !(data[offset + 1] >= 0xd0 && data[offset + 1] <= 0xd7)
    )
  )
    offset++;
  return offset;
}

// ---------- EXIF orientation ----------

/** Finds the EXIF Orientation tag; returns its value and where to patch it. */
function readOrientation(seg: Segment): { value: number; at: number } | null {
  const b = seg.bytes;
  // FF E1 len(2) "Exif\0\0" then TIFF header
  if (seg.marker !== 0xe1 || b.length < 18) return null;
  if (
    String.fromCharCode(b[4], b[5], b[6], b[7]) !== "Exif" ||
    b[8] !== 0 ||
    b[9] !== 0
  )
    return null;
  const t = 10;
  const le = b[t] === 0x49;
  const r16 = (o: number) =>
    le ? b[t + o] | (b[t + o + 1] << 8) : (b[t + o] << 8) | b[t + o + 1];
  const r32 = (o: number) =>
    le
      ? (b[t + o] | (b[t + o + 1] << 8) | (b[t + o + 2] << 16)) +
        b[t + o + 3] * 2 ** 24
      : b[t + o] * 2 ** 24 +
        ((b[t + o + 1] << 16) | (b[t + o + 2] << 8) | b[t + o + 3]);
  const ifd = r32(4);
  if (t + ifd + 2 > b.length) return null;
  const n = r16(ifd);
  for (let i = 0; i < n; i++) {
    const e = ifd + 2 + i * 12;
    if (t + e + 12 > b.length) return null;
    if (r16(e) === 0x0112) return { value: r16(e + 8), at: t + e + 8 };
  }
  return null;
}

const XMP_NS = "http://ns.adobe.com/xap/1.0/";
const isXmp = (b: Uint8Array) =>
  String.fromCharCode(...b.subarray(4, 4 + XMP_NS.length)) === XMP_NS;

/** Sets tiff:Orientation in XMP to 1 (same byte length), so XMP-aware editors don't rotate again. */
function resetXmpOrientation(b: Uint8Array) {
  // Byte-to-char (not TextDecoder: "latin1" there is windows-1252 and would remap bytes).
  let text = "";
  for (let i = 0; i < b.length; i += 8192)
    text += String.fromCharCode(...b.subarray(i, i + 8192));
  const fixed = text
    .replace(/(tiff:Orientation\s*=\s*["'])[1-8](["'])/g, "$11$2")
    .replace(/(<tiff:Orientation>)[1-8](<)/g, "$11$2");
  if (fixed === text) return b;
  const out = new Uint8Array(b.length);
  for (let i = 0; i < fixed.length; i++) out[i] = fixed.charCodeAt(i);
  return out;
}

/** Quantization tables follow the coefficients: a transpose swaps their rows and columns too. */
function transposeQuant(seg: Uint8Array) {
  const out = seg.slice();
  const natToZig = new Int32Array(64);
  for (let k = 0; k < 64; k++) natToZig[ZIGZAG[k]] = k;
  for (let p = 4; p < seg.length;) {
    const wide = seg[p] >> 4 ? 2 : 1;
    const base = p + 1;
    for (let k = 0; k < 64; k++) {
      const nat = ZIGZAG[k];
      const srcK = natToZig[(nat & 7) * 8 + (nat >> 3)];
      for (let b = 0; b < wide; b++)
        out[base + k * wide + b] = seg[base + srcK * wide + b];
    }
    p = base + 64 * wide;
  }
  return out;
}

// ---------- Huffman encoding ----------

/** JPEG Annex K.2: optimal code lengths limited to 16 bits. Returns the DHT counts and values. */
function optimalTable(freqIn: Int32Array) {
  const freq = Array.from(freqIn);
  freq[256] = 1; // reserve one code point so no code is all ones
  const codesize = new Array<number>(257).fill(0);
  const others = new Array<number>(257).fill(-1);
  for (;;) {
    let c1 = -1;
    let v = 1e18;
    for (let i = 0; i <= 256; i++)
      if (freq[i] && freq[i] <= v) {
        v = freq[i];
        c1 = i;
      }
    let c2 = -1;
    v = 1e18;
    for (let i = 0; i <= 256; i++)
      if (freq[i] && freq[i] <= v && i !== c1) {
        v = freq[i];
        c2 = i;
      }
    if (c2 < 0) break;
    freq[c1] += freq[c2];
    freq[c2] = 0;
    codesize[c1]++;
    while (others[c1] >= 0) {
      c1 = others[c1];
      codesize[c1]++;
    }
    others[c1] = c2;
    codesize[c2]++;
    while (others[c2] >= 0) {
      c2 = others[c2];
      codesize[c2]++;
    }
  }
  const bits = new Array<number>(33).fill(0);
  for (let i = 0; i <= 256; i++) if (codesize[i]) bits[codesize[i]]++;
  for (let i = 32; i > 16; i--) {
    while (bits[i] > 0) {
      let j = i - 2;
      while (bits[j] === 0) j--;
      bits[i] -= 2;
      bits[i - 1]++;
      bits[j + 1] += 2;
      bits[j]--;
    }
  }
  let i = 16;
  while (bits[i] === 0) i--;
  bits[i]--; // drop the reserved code point
  const values: number[] = [];
  for (let len = 1; len <= 32; len++)
    for (let s = 0; s < 256; s++) if (codesize[s] === len) values.push(s);
  const counts = bits.slice(1, 17);
  // Build the encoder lookup (Annex C).
  const code = new Int32Array(256);
  const size = new Int8Array(256);
  let k = 0;
  let c = 0;
  for (let len = 1; len <= 16; len++) {
    for (let n = 0; n < counts[len - 1]; n++) {
      code[values[k]] = c++;
      size[values[k]] = len;
      k++;
    }
    c <<= 1;
  }
  return { counts, values, code, size };
}

class BitWriter {
  buf = new Uint8Array(1 << 16);
  len = 0;
  private acc = 0;
  private n = 0;
  private push(byte: number) {
    if (this.len + 2 > this.buf.length) {
      const next = new Uint8Array(this.buf.length * 2);
      next.set(this.buf);
      this.buf = next;
    }
    this.buf[this.len++] = byte;
    if (byte === 0xff) this.buf[this.len++] = 0;
  }
  write(value: number, bits: number) {
    for (let i = bits - 1; i >= 0; i--) {
      this.acc = (this.acc << 1) | ((value >> i) & 1);
      if (++this.n === 8) {
        this.push(this.acc);
        this.acc = 0;
        this.n = 0;
      }
    }
  }
  flush() {
    if (this.n) this.write(0x7f, 8 - this.n);
    return this.buf.subarray(0, this.len);
  }
}

const bitLength = (v: number) => (v === 0 ? 0 : 32 - Math.clz32(v));

// ---------- the transform ----------

export type LosslessResult = {
  bytes: Uint8Array;
  width: number;
  height: number;
  trimmed: { x: number; y: number };
};

/**
 * Applies `o` (in the displayed orientation) to a JPEG without recompressing.
 * Throws UnsupportedJpeg for files it can't handle; callers fall back to canvas export.
 */
export function transformJpeg(input: Uint8Array, o: Orient): LosslessResult {
  const { frame, quant, keep, quant16 } = decode(input);

  // Fold in the EXIF orientation: stored pixels → displayed → user's change.
  let orientationAt: { seg: number; at: number } | null = null;
  let total = o;
  keep.forEach((seg, i) => {
    const found = orientationAt ? null : readOrientation(seg);
    if (found) {
      orientationAt = { seg: i, at: found.at };
      total = compose(exifOrient(found.value), o);
    }
  });
  const { transpose, flipH, flipV } = decompose(total);

  // Which source axes end up mirrored (their trailing edge moves to the front).
  const mirrorX = transpose ? flipV : flipH;
  const mirrorY = transpose ? flipH : flipV;
  const mcuW = 8 * frame.hmax;
  const mcuH = 8 * frame.vmax;
  const srcW = mirrorX ? Math.floor(frame.width / mcuW) * mcuW : frame.width;
  const srcH = mirrorY ? Math.floor(frame.height / mcuH) * mcuH : frame.height;
  if (srcW === 0 || srcH === 0)
    throw new UnsupportedJpeg("Image is smaller than one block group");
  const outW = transpose ? srcH : srcW;
  const outH = transpose ? srcW : srcH;

  // Output frame geometry (sampling factors swap with the axes).
  // A single-component image is coded block by block, so its sampling factors are 1.
  const single = frame.components.length === 1;
  const outComps = frame.components.map((c) => {
    const h = single ? 1 : transpose ? c.v : c.h;
    const v = single ? 1 : transpose ? c.h : c.v;
    return { src: c, id: c.id, h, v, tq: c.tq };
  });
  const hmax = Math.max(...outComps.map((c) => c.h));
  const vmax = Math.max(...outComps.map((c) => c.v));
  const mcusPerLine = Math.ceil(outW / (8 * hmax));
  const mcusPerColumn = Math.ceil(outH / (8 * vmax));

  const sign = new Int8Array(64);
  const from = new Int32Array(64);
  for (let v = 0; v < 8; v++) {
    for (let u = 0; u < 8; u++) {
      sign[v * 8 + u] = (flipH && u & 1 ? -1 : 1) * (flipV && v & 1 ? -1 : 1);
      from[v * 8 + u] = transpose ? u * 8 + v : v * 8 + u;
    }
  }

  const blocks = outComps.map((oc) => {
    const c = oc.src;
    const bpl = Math.ceil(Math.ceil((outW * oc.h) / hmax) / 8);
    const bpc = Math.ceil(Math.ceil((outH * oc.v) / vmax) / 8);
    const bplMcu = mcusPerLine * oc.h;
    const bpcMcu = mcusPerColumn * oc.v;
    const out = new Int16Array(bplMcu * bpcMcu * 64);
    for (let oy = 0; oy < bpcMcu; oy++) {
      for (let ox = 0; ox < bplMcu; ox++) {
        // Padding blocks beyond the image repeat the nearest real block's DC only.
        const real = ox < bpl && oy < bpc;
        const rx = Math.min(ox, bpl - 1);
        const ry = Math.min(oy, bpc - 1);
        const x1 = flipH ? bpl - 1 - rx : rx;
        const y1 = flipV ? bpc - 1 - ry : ry;
        const sx = transpose ? y1 : x1;
        const sy = transpose ? x1 : y1;
        const so = 64 * (sy * c.blocksPerLineForMcu + sx);
        const dst = 64 * (oy * bplMcu + ox);
        if (!real) {
          out[dst] = c.data[so];
          continue;
        }
        for (let k = 0; k < 64; k++)
          out[dst + k] = c.data[so + from[k]] * sign[k];
      }
    }
    return { ...oc, bplMcu, out };
  });

  // Two passes: count symbols for optimal tables, then write.
  const tableOf = (i: number) => (i === 0 ? 0 : 1);
  const nTables = blocks.length > 1 ? 2 : 1;
  const dcFreq = [new Int32Array(257), new Int32Array(257)];
  const acFreq = [new Int32Array(257), new Int32Array(257)];
  type Tables = ReturnType<typeof optimalTable>[];
  const walk = (
    emit: (
      t: number,
      isAc: boolean,
      sym: number,
      extra: number,
      extraBits: number,
    ) => void,
  ) => {
    const preds = blocks.map(() => 0);
    for (let mr = 0; mr < mcusPerColumn; mr++) {
      for (let mc = 0; mc < mcusPerLine; mc++) {
        blocks.forEach((b, ci) => {
          const t = tableOf(ci);
          for (let j = 0; j < b.v; j++) {
            for (let i = 0; i < b.h; i++) {
              const o = 64 * ((mr * b.v + j) * b.bplMcu + mc * b.h + i);
              const d = b.out;
              const diff = d[o] - preds[ci];
              preds[ci] = d[o];
              const cat = bitLength(Math.abs(diff));
              if (cat > 11)
                throw new UnsupportedJpeg("Coefficient out of range");
              emit(t, false, cat, diff < 0 ? diff + (1 << cat) - 1 : diff, cat);
              let run = 0;
              for (let k = 1; k < 64; k++) {
                const val = d[o + ZIGZAG[k]];
                if (val === 0) {
                  run++;
                  continue;
                }
                while (run > 15) {
                  emit(t, true, 0xf0, 0, 0);
                  run -= 16;
                }
                const size = bitLength(Math.abs(val));
                if (size > 10)
                  throw new UnsupportedJpeg("Coefficient out of range");
                emit(
                  t,
                  true,
                  (run << 4) | size,
                  val < 0 ? val + (1 << size) - 1 : val,
                  size,
                );
                run = 0;
              }
              if (run > 0) emit(t, true, 0x00, 0, 0);
            }
          }
        });
      }
    }
  };
  walk((t, isAc, sym) => (isAc ? acFreq : dcFreq)[t][sym]++);
  const dcT: Tables = [];
  const acT: Tables = [];
  for (let t = 0; t < nTables; t++) {
    dcT.push(optimalTable(dcFreq[t]));
    acT.push(optimalTable(acFreq[t]));
  }
  const bw = new BitWriter();
  walk((t, isAc, sym, extra, extraBits) => {
    const tab = (isAc ? acT : dcT)[t];
    bw.write(tab.code[sym], tab.size[sym]);
    if (extraBits) bw.write(extra, extraBits);
  });
  const entropy = bw.flush();

  // Assemble the file.
  const parts: Uint8Array[] = [new Uint8Array([0xff, 0xd8])];
  keep.forEach((seg, i) => {
    if (seg.marker === 0xe1 && isXmp(seg.bytes)) {
      parts.push(resetXmpOrientation(seg.bytes));
    } else if (orientationAt && orientationAt.seg === i) {
      const copy = seg.bytes.slice();
      const at = orientationAt.at;
      const le = copy[10] === 0x49;
      copy[at] = le ? 1 : 0;
      copy[at + 1] = le ? 0 : 1;
      parts.push(copy);
    } else parts.push(seg.bytes);
  });
  for (const q of quant)
    parts.push(transpose ? transposeQuant(q.bytes) : q.bytes);
  const sof = [
    0xff,
    quant16 ? 0xc1 : 0xc0,
    0,
    8 + 3 * blocks.length,
    8,
    outH >> 8,
    outH & 255,
    outW >> 8,
    outW & 255,
    blocks.length,
  ];
  for (const b of blocks) sof.push(b.id, (b.h << 4) | b.v, b.tq);
  parts.push(new Uint8Array(sof));
  const dht: number[] = [];
  for (let t = 0; t < nTables; t++) {
    for (const [cls, tab] of [
      [0, dcT[t]],
      [1, acT[t]],
    ] as const) {
      dht.push((cls << 4) | t, ...tab.counts, ...tab.values);
    }
  }
  parts.push(
    new Uint8Array([
      0xff,
      0xc4,
      (dht.length + 2) >> 8,
      (dht.length + 2) & 255,
      ...dht,
    ]),
  );
  const sos = [0xff, 0xda, 0, 6 + 2 * blocks.length, blocks.length];
  blocks.forEach((b, ci) => sos.push(b.id, (tableOf(ci) << 4) | tableOf(ci)));
  sos.push(0, 63, 0);
  parts.push(new Uint8Array(sos), entropy, new Uint8Array([0xff, 0xd9]));

  const size = parts.reduce((n, p) => n + p.length, 0);
  const bytes = new Uint8Array(size);
  let p = 0;
  for (const part of parts) {
    bytes.set(part, p);
    p += part.length;
  }
  const cutX = frame.width - srcW;
  const cutY = frame.height - srcH;
  return {
    bytes,
    width: outW,
    height: outH,
    trimmed: transpose ? { x: cutY, y: cutX } : { x: cutX, y: cutY },
  };
}

/**
 * Dequantized coefficients of every real block, per component (for tests: two
 * files with equal output here decode to identical pixels).
 */
export function readDequantized(input: Uint8Array) {
  const { frame, quant } = decode(input);
  const tables: Int32Array[] = [];
  for (const q of quant) {
    const b = q.bytes;
    for (let p = 4; p < b.length;) {
      const wide = b[p] >> 4 ? 2 : 1;
      const t = new Int32Array(64);
      for (let k = 0; k < 64; k++)
        t[ZIGZAG[k]] = wide === 2 ? u16(b, p + 1 + k * 2) : b[p + 1 + k];
      tables[b[p] & 15] = t;
      p += 1 + 64 * wide;
    }
  }
  return {
    width: frame.width,
    height: frame.height,
    components: frame.components.map((c) => {
      const out = new Int32Array(c.blocksPerLine * c.blocksPerColumn * 64);
      const q = tables[c.tq];
      for (let y = 0; y < c.blocksPerColumn; y++)
        for (let x = 0; x < c.blocksPerLine; x++)
          for (let k = 0; k < 64; k++)
            out[(y * c.blocksPerLine + x) * 64 + k] =
              c.data[64 * (y * c.blocksPerLineForMcu + x) + k] * q[k];
      return { h: c.h, v: c.v, blocks: out };
    }),
  };
}
