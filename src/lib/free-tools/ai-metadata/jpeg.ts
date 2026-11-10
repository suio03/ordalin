import { concat, latin1, put16be, startsWith, u16be } from './bytes.ts'
import type { BlockKind, Container, Decision, RawBlock } from './types.ts'
import { UnsupportedError } from './types.ts'

const EXIF_ID = 'Exif\0\0'
const XMP_ID = 'http://ns.adobe.com/xap/1.0/\0'
const XMP_EXT_ID = 'http://ns.adobe.com/xmp/extension/\0'
const PS_ID = 'Photoshop 3.0\0'

interface Segment {
  marker: number
  start: number
  end: number
  /** Index into blocks, when this segment is a metadata block. */
  block?: number
  /** Length of the identifier before the payload. */
  idLength: number
  mpf?: boolean
}

/**
 * JPEG: metadata lives in APPn/COM segments before the first SOS.
 * Everything from SOS on (entropy-coded data, later markers, trailing MPF images) is copied byte for byte.
 */
export function parseJpeg(b: Uint8Array): Container {
  if (b[0] !== 0xff || b[1] !== 0xd8) throw new UnsupportedError('not a JPEG')
  const segments: Segment[] = []
  const blocks: RawBlock[] = []
  let i = 2
  let scanStart = -1
  while (i < b.length) {
    if (b[i] !== 0xff) throw new UnsupportedError('corrupt JPEG marker stream')
    let m = i + 1
    while (b[m] === 0xff) m++
    const marker = b[m]
    if (marker === 0xda) {
      scanStart = i
      break
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i = m + 1
      continue
    }
    if (marker === 0xd9) {
      scanStart = i
      break
    }
    const len = u16be(b, m + 1)
    const start = i
    const end = m + 1 + len
    if (len < 2 || end > b.length) throw new UnsupportedError('truncated JPEG segment')
    const seg: Segment = { marker, start, end, idLength: 0 }
    const p = m + 3
    let kind: BlockKind | null = null
    let label = ''
    if (marker === 0xe1 && startsWith(b, EXIF_ID, p)) {
      kind = 'exif'
      label = 'APP1 EXIF'
      seg.idLength = EXIF_ID.length
    } else if (marker === 0xe1 && startsWith(b, XMP_ID, p)) {
      kind = 'xmp'
      label = 'APP1 XMP'
      seg.idLength = XMP_ID.length
    } else if (marker === 0xe1 && startsWith(b, XMP_EXT_ID, p)) {
      kind = 'xmp'
      label = 'APP1 Extended XMP'
      seg.idLength = XMP_EXT_ID.length + 40
    } else if (marker === 0xed && startsWith(b, PS_ID, p)) {
      kind = 'iptc'
      label = 'APP13 Photoshop/IPTC'
      seg.idLength = PS_ID.length
    } else if (marker === 0xeb && startsWith(b, 'JP', p)) {
      // JUMBF (ISO 19566-5): CI "JP", En (2), Z (4), then the superbox. C2PA uses this.
      const isC2pa = latin1(b.subarray(p, Math.min(end, p + 64))).includes('c2pa') || latin1(b.subarray(p, end)).includes('c2pa')
      kind = isC2pa ? 'c2pa' : 'other'
      label = isC2pa ? 'APP11 C2PA (JUMBF)' : 'APP11 JUMBF'
      seg.idLength = 8
    } else if (marker === 0xfe) {
      kind = 'comment'
      label = 'COM comment'
    } else if (marker === 0xe2 && startsWith(b, 'MPF\0', p)) {
      seg.mpf = true
    } else if (marker === 0xe0 && (startsWith(b, 'JFIF\0', p) || startsWith(b, 'JFXX\0', p))) {
      // keep
    } else if (marker === 0xe2 && startsWith(b, 'ICC_PROFILE\0', p)) {
      // keep: color profile
    } else if (marker === 0xee && startsWith(b, 'Adobe', p)) {
      // keep: APP14 Adobe carries the color transform needed to decode
    } else if (marker >= 0xe0 && marker <= 0xef) {
      kind = 'other'
      const id = latin1(b.subarray(p, Math.min(end, p + 24))).split('\0')[0].replace(/[^\x20-\x7e]/g, '')
      label = `APP${marker - 0xe0}${id ? ` ${id}` : ''}`
    }
    if (kind) {
      seg.block = blocks.length
      blocks.push({ id: blocks.length, kind, label, size: end - start, payload: b.subarray(p + seg.idLength, end) })
    }
    segments.push(seg)
    i = end
  }
  if (scanStart < 0) throw new UnsupportedError('JPEG has no image data')

  return {
    format: 'jpeg',
    blocks,
    imageData: () => b.subarray(scanStart),
    rebuild(decide: (blk: RawBlock) => Decision) {
      const parts: Uint8Array[] = [b.subarray(0, 2)]
      let pos = 2
      let mpfNewEnd = -1
      let mpfOldEnd = -1
      let mpfNewStart = -1
      for (const seg of segments) {
        let out: Uint8Array | null = b.subarray(seg.start, seg.end)
        if (seg.block !== undefined) {
          const d = decide(blocks[seg.block])
          if (d === 'drop') out = null
          else if (d !== 'keep') {
            const head = b.subarray(seg.start, seg.start + 4 + seg.idLength)
            const len = 2 + seg.idLength + d.replace.length
            if (len > 0xffff) throw new UnsupportedError('replacement too large for a JPEG segment')
            out = concat([head, d.replace])
            out = out.slice()
            put16be(out, 2, len)
          }
        }
        if (!out) continue
        if (seg.mpf) {
          mpfNewStart = pos
          mpfOldEnd = seg.end
          mpfNewEnd = pos + out.length
        }
        parts.push(out)
        pos += out.length
      }
      const result = concat([...parts, b.subarray(scanStart)])
      if (mpfNewStart >= 0) {
        // MPF offsets are relative to the MPF TIFF header; bytes removed between the MPF segment and SOS shift later images.
        const delta = scanStart - mpfOldEnd - (pos - mpfNewEnd)
        if (delta !== 0) shiftMpf(result, mpfNewStart, -delta)
      }
      return result
    },
  }
}

function shiftMpf(b: Uint8Array, segStart: number, shift: number) {
  const tiff = segStart + 4 + 4
  const le = b[tiff] === 0x49
  const r16 = (o: number) => (le ? b[o] | (b[o + 1] << 8) : (b[o] << 8) | b[o + 1])
  const r32 = (o: number) => (le ? (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0 : ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0)
  const w32 = (o: number, v: number) => {
    if (le) {
      b[o] = v & 0xff
      b[o + 1] = (v >>> 8) & 0xff
      b[o + 2] = (v >>> 16) & 0xff
      b[o + 3] = (v >>> 24) & 0xff
    } else {
      b[o] = (v >>> 24) & 0xff
      b[o + 1] = (v >>> 16) & 0xff
      b[o + 2] = (v >>> 8) & 0xff
      b[o + 3] = v & 0xff
    }
  }
  const ifd = tiff + r32(tiff + 4)
  const n = r16(ifd)
  for (let i = 0; i < n; i++) {
    const e = ifd + 2 + i * 12
    if (r16(e) !== 0xb002) continue
    const count = r32(e + 4)
    const entries = tiff + r32(e + 8)
    for (let k = 0; k < count / 16; k++) {
      const off = entries + k * 16 + 8
      const v = r32(off)
      if (v !== 0) w32(off, v + shift)
    }
  }
}
