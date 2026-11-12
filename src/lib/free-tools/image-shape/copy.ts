// UI strings for the circle crop and square image tools. English defines the
// type, so each locale file (docs/i18n/README.md) must have every key.

export const en = {
  drop: {
    title: "Drop an image here",
    action: "or choose a file",
    limits: "JPG, PNG or WebP, up to {mb} MB. The image stays in your browser.",
  },
  errors: {
    type: "This file type isn't supported. Use a JPG, PNG or WebP image.",
    bytes: "This file is larger than {mb} MB. Pick a smaller one.",
    pixels: "This image is {mp} megapixels. The limit is {max}, so the browser tab doesn't run out of memory. Resize it first.",
    decode: "This image couldn't be opened. It may be damaged or in a format your browser can't read.",
    export: "The download couldn't be created. Try a smaller output size.",
  },
  stage: {
    label: "Crop area. Drag to move the image, use the arrow keys to nudge it, and plus or minus to zoom.",
    hint: "Drag to move. Scroll, pinch or use the slider to zoom.",
    zoom: "Zoom",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    reset: "Reset",
    replace: "Use another image",
  },
  output: {
    size: "Output size",
    original: "Original ({n} px)",
    px: "{n} px",
    format: "Format",
    download: "Download {format}",
    working: "Preparing…",
    jpegNote: "JPG can't be transparent, so the empty area is filled with white. Choose PNG or WebP to keep it see-through.",
    preview: "Preview",
    onLight: "On a light page",
    onDark: "On a dark page",
    upscaled: "Larger than the selected area, so it will be upscaled and look softer.",
  },
  colors: {
    transparent: "Transparent",
    white: "White",
    black: "Black",
    custom: "Custom",
    customLabel: "Custom color",
  },
  circle: {
    background: "Outside the circle",
    border: "Border",
    borderNone: "None",
    borderWidth: "Border width",
    borderColor: "Border color",
  },
  square: {
    mode: "How to make it square",
    fit: "Fit",
    fitHint: "Keep the whole image and fill the sides",
    crop: "Crop",
    cropHint: "Cut a 1:1 area out of the image",
    fill: "Fill the sides with",
    blur: "Blurred image",
    padding: "Padding",
  },
};

export type ImageShapeCopy = typeof en;

/** Fills "{name}" slots: fmt('{n} px', { n: 512 }). */
export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
