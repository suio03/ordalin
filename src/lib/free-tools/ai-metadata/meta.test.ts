// Ported from ailabelremover.tools (same owner); keeps the lossless and detection guarantees.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { clean, open, scan } from './index.ts'
import { u16be, u32be, u32le } from './bytes.ts'

const dir = new URL('./fixtures/', import.meta.url)
const read = (name: string) => new Uint8Array(readFileSync(new URL(name, dir)))
const AI_FILES = ['ai.jpg', 'mpf.jpg', 'sd.png', 'ai.webp', 'ai.heic', 'ai.avif']
const ALL = [...AI_FILES, 'camera.jpg', 'phone.jpg']

const sameBytes = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((x, i) => x === b[i])

for (const name of ALL) {
  for (const mode of ['all', 'ai-only'] as const) {
    test(`${name} ${mode}: image data unchanged, no AI left, rescan clean`, () => {
      const b = read(name)
      const r = clean(b, mode)
      assert.ok(sameBytes(open(b).imageData(), open(r.bytes).imageData()), 'image data must be byte-identical')
      assert.equal(r.after.signals.length, 0, JSON.stringify(r.after.signals))
      assert.deepEqual(r.after.residual, [])
      assert.ok(!r.after.blocks.some((x) => x.kind === 'c2pa'))
      assert.equal(r.after.format, r.before.format)
    })
  }
}

test('R1/R2: every AI fixture is detected as ai, the camera photo as normal', () => {
  for (const name of AI_FILES) assert.equal(scan(read(name)).verdict, 'ai', name)
  assert.equal(scan(read('camera.jpg')).verdict, 'normal')
})

test('R1: the standard fields are found', () => {
  const s = scan(read('ai.jpg'))
  const keys = s.signals.map((x) => x.key)
  for (const k of ['Iptc4xmpExt:DigitalSourceType', 'xmp:CreatorTool', 'photoshop:Credit', 'Software', 'Comment', 'C2PA generator', 'C2PA digitalSourceType']) assert.ok(keys.includes(k), k)
  const png = scan(read('sd.png')).signals.map((x) => x.key)
  for (const k of ['parameters', 'workflow', 'C2PA generator']) assert.ok(png.includes(k), k)
})

test('R3: default clean keeps orientation and the ICC profile', () => {
  for (const name of ['ai.jpg', 'sd.png', 'ai.webp']) {
    const r = clean(read(name), 'all')
    assert.equal(r.before.orientation, 6, name)
    assert.equal(r.after.orientation, 6, name)
    const exif = r.after.blocks.filter((x) => x.kind === 'exif')
    assert.equal(exif.length, 1)
    assert.deepEqual(exif[0].fields.map((f) => f.key), ['Orientation'], `${name}: only Orientation is left`)
  }
  const jpg = clean(read('ai.jpg'), 'all').bytes
  assert.ok(Buffer.from(jpg).includes('ICC_PROFILE\0'), 'JPEG ICC kept')
  assert.ok(Buffer.from(clean(read('sd.png'), 'all').bytes).includes('iCCP'), 'PNG ICC kept')
  assert.ok(Buffer.from(clean(read('ai.webp'), 'all').bytes).includes('ICCP'), 'WebP ICC kept')
})

test('R4: AI-only mode keeps camera fields and plain text', () => {
  for (const name of ['ai.jpg', 'sd.png', 'ai.webp', 'ai.heic', 'ai.avif']) {
    const r = clean(read(name), 'ai-only')
    const fields = (s: typeof r.before) => s.blocks.filter((x) => x.kind === 'exif').flatMap((x) => x.fields.filter((f) => !f.ai).map((f) => `${f.key}=${f.value}`))
    assert.deepEqual(fields(r.after), fields(r.before), name)
    assert.ok(fields(r.after).includes('Model=Canon EOS R5'), name)
  }
  const png = clean(read('sd.png'), 'ai-only').after
  assert.ok(png.blocks.some((x) => x.label === 'tEXt Title'))
  // A normal photo is left byte for byte.
  const cam = read('camera.jpg')
  assert.ok(sameBytes(clean(cam, 'ai-only').bytes, cam))
})

test('Privacy: GPS, device, date and author are found; all mode removes them, ai-only keeps them', () => {
  const s = scan(read('phone.jpg'))
  assert.equal(s.verdict, 'normal')
  const kinds = new Set(s.privacy.map((p) => p.kind))
  for (const k of ['location', 'device', 'date', 'person'] as const) assert.ok(kinds.has(k), k)
  // 23°33'12.34"S 46°38'10.56"W
  assert.ok(s.privacy.some((p) => p.kind === 'location' && p.value === '-23.55343, -46.63627'), JSON.stringify(s.privacy))
  assert.ok(s.privacy.some((p) => p.kind === 'device' && p.value === 'F2LXK0QJ1234'), 'body serial')
  assert.ok(s.privacy.some((p) => p.kind === 'person' && p.value === 'Maria Souza'), 'artist')
  const all = clean(read('phone.jpg'), 'all')
  assert.deepEqual(all.after.privacy, [])
  const kept = clean(read('phone.jpg'), 'ai-only')
  assert.equal(kept.after.privacy.length, s.privacy.length)
  // AI fixtures carry camera fields too: privacy is reported there, and gone after 'all'.
  for (const name of AI_FILES) assert.deepEqual(clean(read(name), 'all').after.privacy, [], name)
})

test('JPEG MPF: the secondary image offset still points at a JPEG', () => {
  const r = clean(read('mpf.jpg'), 'all')
  const b = r.bytes
  const at = Buffer.from(b).indexOf('MPF\0')
  const tiff = at + 4
  const ifd = tiff + u32be(b, tiff + 4)
  let entries = -1
  for (let i = 0; i < u16be(b, ifd); i++) {
    const e = ifd + 2 + i * 12
    if (u16be(b, e) === 0xb002) entries = tiff + u32be(b, e + 8)
  }
  assert.ok(entries > 0)
  const second = tiff + u32be(b, entries + 16 + 8)
  assert.equal(b[second], 0xff)
  assert.equal(b[second + 1], 0xd8)
})

test('PNG: every chunk CRC is valid after cleaning', async () => {
  const { crc32 } = await import('node:zlib')
  for (const mode of ['all', 'ai-only'] as const) {
    const b = clean(read('sd.png'), mode).bytes
    for (let i = 8; i < b.length; ) {
      const len = u32be(b, i)
      assert.equal(crc32(b.subarray(i + 4, i + 8 + len)), u32be(b, i + 8 + len))
      i += 12 + len
    }
  }
})

test('WebP: RIFF size and VP8X flags match the chunks', () => {
  const all = clean(read('ai.webp'), 'all').bytes
  assert.equal(u32le(all, 4), all.length - 8)
  const flags = all[20]
  assert.ok(flags & 0x08, 'EXIF flag set (orientation-only EXIF kept)')
  assert.ok(!(flags & 0x04), 'XMP flag cleared')
  assert.ok(flags & 0x20, 'ICC flag kept')
})

test('HEIC/AVIF: Exif and XMP items removed from the item index', () => {
  for (const name of ['ai.heic', 'ai.avif']) {
    const r = clean(read(name), 'all')
    assert.equal(r.after.blocks.length, 0, name)
    assert.ok(!Buffer.from(r.bytes).includes('application/rdf+xml'), name)
  }
})

test('unsupported input is rejected', () => {
  assert.throws(() => scan(new TextEncoder().encode('GIF89a not supported')))
})
