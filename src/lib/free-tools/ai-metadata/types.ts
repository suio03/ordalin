export type Format = 'jpeg' | 'png' | 'webp' | 'heic' | 'avif'

/** What a metadata block is. `keep` blocks (ICC, structure) are never removed. */
export type BlockKind = 'c2pa' | 'xmp' | 'exif' | 'iptc' | 'text' | 'comment' | 'other'

export type Mode = 'all' | 'ai-only'

/** A metadata block found in a file, as the container parser sees it. */
export interface RawBlock {
  id: number
  kind: BlockKind
  /** Where it lives, e.g. "APP1 Exif", "tEXt parameters", "Exif item". */
  label: string
  /** Size of the block in the file, in bytes. */
  size: number
  /** The meaningful bytes: TIFF for EXIF, XML for XMP, JUMBF for C2PA, text for text chunks. */
  payload: Uint8Array
  /** For text chunks: the keyword. */
  key?: string
}

export interface Field {
  key: string
  value: string
  /** True when this field is an AI signal (generator name, AI source type, prompt). */
  ai: boolean
  /** Why it counts as AI. */
  reason?: string
  /** Personal data this field reveals (only on non-AI fields). */
  privacy?: PrivacyKind
}

/** Kinds of personal data a photo can carry. */
export type PrivacyKind = 'location' | 'device' | 'date' | 'person'

/** One piece of personal data found in the file. */
export interface PrivacyItem {
  kind: PrivacyKind
  key: string
  value: string
  label: string
}

export interface Block {
  id: number
  kind: BlockKind
  label: string
  size: number
  fields: Field[]
  /** Any AI signal in this block. */
  ai: boolean
}

/**
 * ai: AI metadata found, cleaning should help.
 * provenance: C2PA credentials without an explicit AI marker (still read by platforms).
 * normal: only ordinary metadata (camera, editor); a label is probably not metadata-driven.
 * none: no metadata at all.
 */
export type Verdict = 'ai' | 'provenance' | 'normal' | 'none'

export interface Scan {
  format: Format
  blocks: Block[]
  verdict: Verdict
  /** AI signals across all blocks, in file order. */
  signals: (Field & { label: string })[]
  /** Personal data (location, device, date, author) across all blocks, in file order. */
  privacy: PrivacyItem[]
  /** EXIF orientation (1–8) when present. */
  orientation?: number
  /** AI markers found in the raw bytes outside any parsed block (only checked when asked). */
  residual: string[]
}

/** What to do with a block when rebuilding the file. A replacement payload has the same meaning as RawBlock.payload. */
export type Decision = 'keep' | 'drop' | { replace: Uint8Array }

export interface Container {
  format: Format
  blocks: RawBlock[]
  rebuild(decide: (b: RawBlock) => Decision): Uint8Array
  /** The bytes that encode the image itself; cleaning must leave them identical. */
  imageData(): Uint8Array
}

export class UnsupportedError extends Error {}
