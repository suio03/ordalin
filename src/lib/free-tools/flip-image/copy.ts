// UI strings for the flip image tool. English defines the type, so a later
// locale file must have every key.
import type { OrientName } from "./orient";

export const en = {
  name: "Flip image",
  drop: {
    title: "Drop images here",
    action: "or choose files",
    paste: "You can also paste a screenshot with {key}+V.",
    limits:
      "JPG, PNG or WebP. Up to {files} images, {mb} MB each. Nothing is uploaded.",
  },
  errors: {
    type: "{name}: not a JPG, PNG or WebP image.",
    bytes: "{name}: larger than {mb} MB.",
    pixels:
      "{name}: {mp} megapixels is over the {max} MP limit. Resize it first.",
    decode: "{name}: couldn't be opened. It may be damaged.",
    tooMany: "Only the first {files} images were added.",
    export: "{name}: the download couldn't be created.",
  },
  controls: {
    label: "Flip and rotate",
    flipH: "Flip horizontal",
    flipV: "Flip vertical",
    rotateLeft: "Rotate left",
    rotateRight: "Rotate right",
    reset: "Reset",
  },
  state: {
    none: "Not changed yet. Pick a flip or rotation.",
    flipH: "Flipped horizontally (left ↔ right)",
    flipV: "Flipped vertically (upside down)",
    rotate180: "Rotated 180°",
    rotateCW: "Rotated 90° right",
    rotateCCW: "Rotated 90° left",
    transpose: "Rotated 90° right and flipped horizontally",
    transverse: "Rotated 90° left and flipped horizontally",
  } satisfies Record<OrientName, string>,
  list: {
    remove: "Remove {name}",
    lossless: "Lossless, no re-compression",
    trimmed: "{n} px edge trimmed",
    reencoded: "Re-saved at 95% quality",
    pngOut: "Saved as PNG (this browser can't save WebP)",
    size: "{w} × {h}",
  },
  output: {
    download: "Download",
    downloadZip: "Download all ({n}) as ZIP",
    working: "Preparing…",
    add: "Add images",
    clear: "Clear all",
    keepExact: "Keep every pixel instead (re-saves the JPG at 95% quality)",
    keepExactHint:
      "Lossless JPG flips work in 8 or 16 px blocks, so up to 15 px can be trimmed from one edge.",
  },
};

export type FlipCopy = typeof en;
