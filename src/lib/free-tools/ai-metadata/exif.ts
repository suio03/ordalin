import { latin1, utf16, utf8 } from './bytes.ts'

/** A TIFF/EXIF tag with the location of its value bytes inside the TIFF payload. */
export interface ExifTag {
  ifd: 'IFD0' | 'Exif' | 'GPS' | 'IFD1'
  tag: number
  type: number
  count: number
  /** Offset of the value bytes within the TIFF payload. */
  valueOffset: number
  valueLength: number
}

const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 }

export const TAG_NAMES: Record<number, string> = {
  0x010e: 'ImageDescription',
  0x010f: 'Make',
  0x0110: 'Model',
  0x0112: 'Orientation',
  0x0131: 'Software',
  0x0132: 'DateTime',
  0x013b: 'Artist',
  0x013c: 'HostComputer',
  0x8298: 'Copyright',
  0x9003: 'DateTimeOriginal',
  0x9286: 'UserComment',
  0x9c9b: 'XPTitle',
  0x9c9c: 'XPComment',
  0x9c9d: 'XPAuthor',
  0x9c9e: 'XPKeywords',
  0x9c9f: 'XPSubject',
  0xa430: 'CameraOwnerName',
  0xa431: 'BodySerialNumber',
  0xa433: 'LensMake',
  0xa434: 'LensModel',
  0xa435: 'LensSerialNumber',
  0x829a: 'ExposureTime',
  0x829d: 'FNumber',
  0x8827: 'ISO',
  0x920a: 'FocalLength',
}

/** Text-like tags that can carry a generator name or a prompt. */
export const TEXT_TAGS = new Set([0x010e, 0x010f, 0x0110, 0x0131, 0x013b, 0x013c, 0x8298, 0x9286, 0x9c9b, 0x9c9c, 0x9c9d, 0x9c9e, 0x9c9f, 0xa430, 0xa433, 0xa434])

export interface ParsedExif {
  le: boolean
  tags: ExifTag[]
  hasGps: boolean
}

/** Find the TIFF header inside an EXIF payload that may start with "Exif\0\0". */
export function tiffStart(b: Uint8Array): number {
  for (let i = 0; i + 4 <= Math.min(b.length, 16); i++) {
    if ((b[i] === 0x49 && b[i + 1] === 0x49 && b[i + 2] === 0x2a && b[i + 3] === 0) || (b[i] === 0x4d && b[i + 1] === 0x4d && b[i + 2] === 0 && b[i + 3] === 0x2a)) return i
  }
  return -1
}

export function parseExif(payload: Uint8Array): ParsedExif | null {
  const start = tiffStart(payload)
  if (start < 0) return null
  const b = payload.subarray(start)
  const le = b[0] === 0x49
  const u16 = (o: number) => (le ? b[o] | (b[o + 1] << 8) : (b[o] << 8) | b[o + 1])
  const u32 = (o: number) => (le ? (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0 : ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0)
  const tags: ExifTag[] = []
  const seen = new Set<number>()
  let hasGps = false

  const readIfd = (offset: number, ifd: ExifTag['ifd']): number => {
    if (offset < 8 || offset + 2 > b.length || seen.has(offset)) return 0
    seen.add(offset)
    const n = u16(offset)
    for (let i = 0; i < n; i++) {
      const e = offset + 2 + i * 12
      if (e + 12 > b.length) break
      const tag = u16(e)
      const type = u16(e + 2)
      const count = u32(e + 4)
      const size = (TYPE_SIZE[type] ?? 1) * count
      const valueOffset = size <= 4 ? e + 8 : u32(e + 8)
      if (valueOffset + size > b.length) continue
      tags.push({ ifd, tag, type, count, valueOffset: valueOffset + start, valueLength: size })
      if (tag === 0x8769) readIfd(u32(e + 8), 'Exif')
      if (tag === 0x8825) {
        hasGps = true
        readIfd(u32(e + 8), 'GPS')
      }
    }
    const nextAt = offset + 2 + n * 12
    return nextAt + 4 <= b.length ? u32(nextAt) : 0
  }

  const next = readIfd(u32(4), 'IFD0')
  if (next) readIfd(next, 'IFD1')
  return { le, tags, hasGps }
}

/** Read a tag value as display text. */
export function tagText(payload: Uint8Array, t: ExifTag, le: boolean): string {
  const v = payload.subarray(t.valueOffset, t.valueOffset + t.valueLength)
  if (t.tag >= 0x9c9b && t.tag <= 0x9c9f) return clean(utf16(v, true))
  if (t.tag === 0x9286) {
    const charset = latin1(v.subarray(0, 8))
    const body = v.subarray(8)
    if (charset.startsWith('UNICODE')) return clean(utf16(body, le))
    return clean(utf8(body))
  }
  if (t.type === 2 || t.type === 1 || t.type === 7) return clean(utf8(v))
  if (t.type === 3) return String(le ? v[0] | (v[1] << 8) : (v[0] << 8) | v[1])
  if (t.type === 5 && v.length >= 8) {
    const n = le ? (v[0] | (v[1] << 8) | (v[2] << 16) | (v[3] << 24)) >>> 0 : ((v[0] << 24) | (v[1] << 16) | (v[2] << 8) | v[3]) >>> 0
    const d = le ? (v[4] | (v[5] << 8) | (v[6] << 16) | (v[7] << 24)) >>> 0 : ((v[4] << 24) | (v[5] << 16) | (v[6] << 8) | v[7]) >>> 0
    return d ? String(Math.round((n / d) * 1000) / 1000) : '0'
  }
  return ''
}

const clean = (s: string) => s.replace(/\0+$/g, '').replace(/\0/g, ' ').trim()

export function orientationOf(payload: Uint8Array): number | undefined {
  const p = parseExif(payload)
  const t = p?.tags.find((x) => x.ifd === 'IFD0' && x.tag === 0x0112)
  if (!p || !t) return undefined
  const v = Number(tagText(payload, t, p.le))
  return v >= 1 && v <= 8 ? v : undefined
}

/** Copy of the payload with the value bytes of the given tags zeroed. Same length, so offsets stay valid. */
export function blankTags(payload: Uint8Array, tags: ExifTag[]): Uint8Array {
  const out = payload.slice()
  for (const t of tags) out.fill(0, t.valueOffset, t.valueOffset + t.valueLength)
  return out
}

/** A minimal little-endian TIFF with only IFD0 Orientation. */
export function orientationOnlyTiff(orientation: number): Uint8Array {
  return Uint8Array.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, orientation & 0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
}

/** GPS position as decimal degrees, from the GPS IFD (tags 1–4). Null when absent or unreadable. */
export function gpsOf(payload: Uint8Array, p: ParsedExif): { lat: number; lon: number } | null {
  const get = (tag: number) => p.tags.find((t) => t.ifd === 'GPS' && t.tag === tag)
  const rational = (t: ExifTag, i: number) => {
    const o = t.valueOffset + i * 8
    const r = (q: number) => (p.le ? (payload[q] | (payload[q + 1] << 8) | (payload[q + 2] << 16) | (payload[q + 3] << 24)) >>> 0 : ((payload[q] << 24) | (payload[q + 1] << 16) | (payload[q + 2] << 8) | payload[q + 3]) >>> 0)
    const d = r(o + 4)
    return d ? r(o) / d : NaN
  }
  const coord = (refTag: number, valTag: number, neg: string) => {
    const v = get(valTag)
    if (!v || v.type !== 5 || v.count < 3) return NaN
    const deg = rational(v, 0) + rational(v, 1) / 60 + rational(v, 2) / 3600
    const ref = get(refTag)
    const sign = ref && String.fromCharCode(payload[ref.valueOffset]).toUpperCase() === neg ? -1 : 1
    return sign * deg
  }
  const lat = coord(1, 2, 'S')
  const lon = coord(3, 4, 'W')
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  if (lat === 0 && lon === 0) return null
  return { lat, lon }
}
