// Renders public/og-default.png, the default 1200 × 630 share image: the
// approved Editorial Cut logo (never redrawn) centred on the light page ground
// with the tagline in text-secondary. Run with `pnpm og:default`.
import sharp from "sharp";

const width = 1200;
const height = 630;
const logoWidth = 520;
const taglineOffset = 96;
const ground = "#e9efec"; // --color-surface-primary (light)
const textSecondary = "#56645f"; // --color-text-secondary (light)
const tagline = "Find the right AI tool";
const output = process.argv[2] ?? "public/og-default.png";

// The SVG viewBox carries whitespace; trim it so the mark is optically centred.
const trimmed = await sharp("brand/assets/svg/ordalin-logo-primary.svg", { density: 600 }).trim().png().toBuffer();
const logo = await sharp(trimmed).resize({ width: logoWidth }).png().toBuffer();
const { height: logoHeight } = await sharp(logo).metadata();
const top = Math.round((height - logoHeight - taglineOffset) / 2);
const text = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<text x="${width / 2}" y="${top + logoHeight + taglineOffset}" text-anchor="middle" ` +
    `font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="40" fill="${textSecondary}">${tagline}</text></svg>`,
);

const info = await sharp({ create: { width, height, channels: 3, background: ground } })
  .composite([
    { input: logo, left: Math.round((width - logoWidth) / 2), top },
    { input: text, left: 0, top: 0 },
  ])
  .png({ compressionLevel: 9 })
  .toFile(output);
console.log(`${output}: ${info.width} × ${info.height}, ${info.size} bytes`);
