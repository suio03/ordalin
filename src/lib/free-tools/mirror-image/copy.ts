// UI strings for the mirror image tool. English defines the type.
import { en as flip } from "../flip-image/copy";

export const en = {
  name: "Mirror image",
  drop: flip.drop,
  errors: flip.errors,
  modes: {
    label: "Effect",
    mirror: "Mirror",
    symmetry: "Symmetry",
    reflection: "Reflection",
  },
  mirror: {
    label: "Direction",
    h: "Left ↔ right",
    v: "Top ↔ bottom",
  },
  symmetry: {
    label: "Side to keep",
    line: "Mirror line",
    lineValue: "{n}%",
    hint: "Move the line to the centre of the face or object. The kept side is mirrored onto the other.",
  },
  reflection: {
    label: "Where the copy goes",
    fade: "Fade the copy out",
    fadeHint: "A fade needs transparency, so JPGs are saved as PNG.",
  },
  sides: {
    left: "Left",
    right: "Right",
    top: "Top",
    bottom: "Bottom",
  },
  list: {
    remove: "Remove {name}",
    lossless: "Lossless, no re-compression",
    trimmed: "{n} px edge trimmed",
    reencoded: "Re-saved at 95% quality",
    pngOut: "Saved as PNG (this browser can't save WebP)",
    pngFade: "Saved as PNG to keep the fade",
    scaled: "Scaled down to fit this browser's size limit",
    size: "{w} × {h}",
  },
  output: {
    download: "Download",
    downloadZip: "Download all ({n}) as ZIP",
    working: "Preparing…",
    add: "Add images",
    clear: "Clear all",
    keepExact: flip.output.keepExact,
    keepExactHint: flip.output.keepExactHint,
  },
};

export type MirrorCopy = typeof en;
