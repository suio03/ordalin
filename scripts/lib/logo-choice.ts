import sharp from "sharp";

export type LogoMeasure = { width: number; height: number };

/**
 * Rank a candidate for a square tool-mark tile. Wordmarks and banners score
 * low because they shrink to an unreadable strip; tiny favicons score low
 * because they blur when scaled to the 72px hero tile.
 */
export function logoScore({ width, height }: LogoMeasure) {
  if (!width || !height) return 0;
  const squareness = Math.min(width, height) / Math.max(width, height);
  const resolution = Math.min(1, Math.max(width, height) / 128);
  return squareness * resolution;
}

/** Visible bounds after removing a fully transparent border. */
export async function measureVisibleLogo(input: Uint8Array): Promise<LogoMeasure> {
  const image = sharp(input, { density: 256, limitInputPixels: 25_000_000, animated: false }).rotate();
  const { hasAlpha } = await image.metadata();
  const { info } = await (hasAlpha ? image.trim({ threshold: 0 }) : image).toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height };
}
