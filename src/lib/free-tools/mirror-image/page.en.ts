import type { ToolPageCopy } from "@/lib/free-tools/image-shape/page-copy";

// Facts: docs/keywords/mirror-image.md, "Verified product facts". Every claim maps to that list.
export const mirrorPageEn: ToolPageCopy = {
  title: "Mirror Image Online: Mirror a Photo, Symmetry and Reflection | Ordalin",
  description:
    "Mirror image online: mirror a photo left to right or top to bottom, make it symmetrical, or add a reflection, in your browser. Free, no sign-up.",
  h1: "Mirror Image Online: Mirror, Symmetry and Reflection",
  subtitle:
    "Mirror image online: mirror a photo left to right or top to bottom, make it symmetrical, or add a reflection, in your browser. Free, no sign-up.",
  sections: [
    {
      id: "how-to",
      h2: "How do you mirror an image?",
      blocks: [
        {
          ol: [
            "**Add your pictures.** Drop up to 10 JPG, PNG or WebP files into the box above, choose them from your phone or computer, or paste a screenshot with Ctrl+V (⌘+V on a Mac).",
            "**Pick an effect.** Mirror reverses the whole picture. Symmetry copies one side onto the other. Reflection adds a mirrored copy next to the original.",
            "**Download.** One image saves as name-mirrored. Several images save together as one ZIP file.",
          ],
        },
        {
          p: "The preview updates as you change the settings, and the same effect applies to every image in the batch.",
        },
      ],
    },
    {
      id: "facts",
      h2: "Quick facts",
      blocks: [
        {
          table: {
            head: ["", ""],
            rows: [
              [
                "What it is",
                "A free mirror image maker with three effects: mirror, symmetry and reflection",
              ],
              ["Images it takes", "JPG, PNG or WebP, up to 10 MB and 40 megapixels each"],
              ["Batch", "Up to 10 images at once, downloaded as one ZIP"],
              [
                "Mirror effect on a JPG",
                "Lossless: the compressed data is rearranged, not re-encoded",
              ],
              [
                "Symmetry and reflection",
                "Drawn at full size; JPGs are saved once at 95% quality, PNGs pixel for pixel with transparency",
              ],
              ["Where it runs", "In your browser. Images are not sent to Ordalin or anyone else"],
              ["Cost", "Free, no sign-up, no watermark"],
            ],
          },
        },
      ],
    },
    {
      id: "what-is",
      h2: "What is a mirror image?",
      blocks: [
        {
          p: "A mirror image is a picture reversed the way a mirror reverses it: left and right swap while top and bottom stay put. A shirt pocket on the left appears on the right, and writing reads backwards. That is exactly what a horizontal mirror does to a photo.",
        },
        {
          p: "Mirroring top to bottom gives the view in a lake: the picture is upside down and reversed. People also use \"mirror image\" for two halves that match, like a symmetrical face or a butterfly. The symmetry and reflection effects make those pictures.",
        },
      ],
    },
    {
      id: "effects",
      h2: "Three ways to mirror a photo",
      blocks: [
        {
          table: {
            head: ["Effect", "What you get", "Size of the result"],
            rows: [
              [
                "**Mirror**",
                "The whole picture reversed, left ↔ right or top ↔ bottom",
                "Same as the original",
              ],
              [
                "**Symmetry**",
                "One side kept and copied, reversed, onto the other side, so both halves match",
                "Twice the kept part: wider or narrower than the original, depending on the line",
              ],
              [
                "**Reflection**",
                "The original plus a mirrored copy below, above or beside it, optionally fading out",
                "Twice as tall or twice as wide",
              ],
            ],
          },
        },
      ],
    },
    {
      id: "symmetry",
      h2: "Make a symmetrical picture",
      blocks: [
        {
          p: "Pick Symmetry, choose the side to keep, and move the mirror line to where the two halves should meet. The line runs from 10% to 90% across the picture, so it can sit on the centre of a face even when the face isn't in the middle of the photo.",
        },
        {
          ul: [
            "**Symmetrical face:** keep the left side, then the right side, and compare. Most faces look noticeably different each way.",
            "**Patterns and art:** mirror a landscape, a building or a texture into an ornament-like design.",
            "**Top and bottom:** keep the top half to build an upside-down twin underneath.",
          ],
        },
        {
          p: "The kept side stays exactly as it was. Because the result is the kept part plus its copy, moving the line also changes the width (or height) of the picture.",
        },
      ],
    },
    {
      id: "reflection",
      h2: "Add a reflection to a photo",
      blocks: [
        {
          p: "Pick Reflection and choose where the mirrored copy goes: below for a water or glossy-floor look, above, or to the right or left for a side-by-side mirror picture. The copy meets the original at the edge with no gap.",
        },
        {
          p: "Tick \"Fade the copy out\" for a softer reflection: it starts at 60% opacity next to the original and fades to fully transparent at the far edge. A fade needs a transparent background, so a JPG with a fade is saved as PNG. Product shots on a white page look natural that way; put the PNG on any background you like.",
        },
      ],
    },
    {
      id: "quality",
      h2: "Does mirroring a picture lower its quality?",
      blocks: [
        {
          ul: [
            "**Mirror on a JPG:** no. The tool uses the same lossless method as our [flip image tool](/free-tools/flip-image): the 8 × 8 pixel blocks are mirrored directly, nothing is compressed again, and the EXIF data stays. Lossless mirroring works in whole blocks, so up to 15 pixels can be trimmed from one edge; tick \"Keep every pixel instead\" to keep the full size at 95% quality.",
            "**Symmetry and reflection on a JPG:** the picture has to be redrawn, so it is saved once at 95% quality. That is very hard to tell from the original.",
            "**PNG:** saved pixel for pixel, transparent areas included, in every effect.",
            "**WebP:** saved at the highest quality. Safari can't save WebP, so in Safari it comes back as a PNG.",
          ],
        },
        {
          p: "Each image card shows the output size and what happened to the file.",
        },
      ],
    },
    {
      id: "uses",
      h2: "When you need a mirror image",
      blocks: [
        {
          ul: [
            "**A selfie that looks backwards:** mirror it left to right so it matches what you saw on screen, or so the writing on your shirt reads correctly.",
            "**Iron-on transfers and printing on glass:** the design has to be printed as a mirror image so it reads correctly from the other side.",
            "**Designs and thumbnails:** turn a person or product to face the text instead of the page edge.",
            "**Product photos:** a faded reflection underneath makes a cut-out product look like it stands on a shiny surface.",
            "**Wallpapers and posts:** symmetry turns ordinary photos into eye-catching patterns.",
          ],
        },
      ],
    },
    {
      id: "other-ways",
      h2: "How to mirror a picture in other apps",
      blocks: [
        {
          table: {
            head: ["App", "Where the mirror option is"],
            rows: [
              [
                "PowerPoint and Word",
                "Select the picture › Picture Format › Rotate › Flip Horizontal",
              ],
              [
                "iPhone Photos",
                "Edit › Crop › the flip button in the top-left corner (left ↔ right only)",
              ],
              [
                "Android",
                "Depends on the gallery app; Samsung Gallery has a flip button next to rotate in its crop tool",
              ],
              ["Canva", "Select the image › Flip › Flip horizontal or Flip vertical"],
              ["Mac Preview", "Tools › Flip Horizontal"],
            ],
          },
        },
        {
          p: "These apps mirror the whole picture. For a symmetrical photo or a reflection you need an editor with layers, or the effects on this page.",
        },
      ],
    },
    {
      id: "limits",
      h2: "Good for, not for",
      blocks: [
        {
          ul: [
            "**Good for:** mirroring photos, screenshots and graphics, symmetry art and reflections, in batches of up to 10.",
            "**Not for:** mirrored text you type (this works on images), animated GIFs or WebP files, HEIC photos straight from an iPhone (convert them to JPG first), or a live mirror from your camera.",
            "**Know before you start:** images over 10 MB or 40 megapixels are refused. A reflection doubles the picture, so a very large result is scaled down to what the browser can save (smaller on iPhone and iPad); the card says when that happens.",
          ],
        },
      ],
    },
  ],
  faqHeading: "FAQ",
  faq: [
    {
      q: "How do I mirror an image online?",
      a: "Add the image, keep the Mirror effect with Left ↔ right, and download. The result is the mirror image of the original.",
    },
    {
      q: "Is mirroring the same as flipping?",
      a: "A horizontal flip and a mirror image are the same thing. Flip tools usually also rotate; this page adds symmetry and reflection effects instead.",
    },
    {
      q: "Is this mirror image maker free? Is there a watermark?",
      a: "It's free, with no sign-up and no watermark, and batch download is included.",
    },
    {
      q: "Are my photos uploaded?",
      a: "No. Everything happens in your browser on your own device; the files are never sent to a server.",
    },
    {
      q: "How do I make one side of my face symmetrical?",
      a: "Choose Symmetry, pick the side to keep, and drag the mirror line to the middle of your face. Try both sides; they rarely look the same.",
    },
    {
      q: "Can I mirror a photo on my iPhone or Android phone?",
      a: "Yes, in the phone's browser. Tap the box to choose photos from your gallery; every control works by touch.",
    },
    {
      q: "Does a mirrored PNG keep its transparent background?",
      a: "Yes, in all three effects.",
    },
    {
      q: "Can I mirror several images at once?",
      a: "Yes, up to 10. They all get the same effect and download together as a ZIP file.",
    },
    {
      q: "How do I mirror text?",
      a: "Make the text into an image first, for example a screenshot, then mirror the image. The tool works on pictures, not on typed text.",
    },
  ],
  closing:
    "Need to rotate the picture as well? [Flip and rotate it in 90° steps](/free-tools/flip-image). You can also [square an image](/free-tools/square-an-image) or [crop an image into a circle](/free-tools/circle-crop-image), see all [free tools](/free-tools), or browse the [Ordalin AI tool directory](/).",
};
