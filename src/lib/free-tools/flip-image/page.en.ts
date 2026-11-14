import type { ToolPageCopy } from "@/lib/free-tools/image-shape/page-copy";

// Facts: docs/keywords/flip-image.md, "Verified product facts". Every claim maps to that list.
export const flipPageEn: ToolPageCopy = {
  title: "Flip Image Online: Free Image Flipper, Lossless JPG | Ordalin",
  description:
    "Flip image online: mirror a picture horizontally or vertically, or rotate it 90°, in your browser. JPGs flip without re-compression. Free, no sign-up.",
  h1: "Flip Image Online Without Losing Quality",
  subtitle:
    "Flip image online: mirror a picture horizontally or vertically, or rotate it 90°, in your browser. JPGs flip without re-compression. Free, no sign-up.",
  sections: [
    {
      id: "how-to",
      h2: "How do you flip an image?",
      blocks: [
        {
          ol: [
            "**Add your images.** Drop up to 10 JPG, PNG or WebP files into the box above, choose them from your phone or computer, or paste a screenshot with Ctrl+V (⌘+V on a Mac).",
            "**Pick the flip.** Flip horizontal swaps left and right; flip vertical turns the picture upside down. Rotate left and right turn it 90°. Press several buttons to combine them, or Reset to start over.",
            "**Download.** One image saves as name-flipped with its original format. Several images save together as one ZIP file.",
          ],
        },
        {
          p: "The preview shows the result before you save, and the same flip applies to every image in the batch.",
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
                "A free flip image tool: an online image flipper that mirrors pictures left to right or upside down and rotates them in 90° steps",
              ],
              [
                "Images it takes",
                "JPG, PNG or WebP, up to 10 MB and 40 megapixels each",
              ],
              ["Batch", "Up to 10 images at once, downloaded as one ZIP"],
              [
                "JPG output",
                "Lossless: the compressed image data is rearranged, not re-encoded",
              ],
              [
                "PNG output",
                "Pixel-for-pixel identical to the original, mirrored; transparency is kept",
              ],
              [
                "Where it runs",
                "In your browser. Images are not sent to Ordalin or anyone else",
              ],
              ["Cost", "Free, no sign-up, no watermark"],
            ],
          },
        },
      ],
    },
    {
      id: "quality",
      h2: "Does flipping an image lower its quality?",
      blocks: [
        {
          p: "It depends on the format and on how the tool saves the result. Most tools that flip image files online draw the picture onto a canvas and save a new file. For PNG that is harmless, but a JPG gets compressed a second time, and every round of JPG compression throws away a little more detail.",
        },
        {
          p: "This image flipper treats each format differently:",
        },
        {
          ul: [
            "**JPG:** flipped losslessly. A JPG stores the picture as 8 × 8 pixel blocks of compressed data, and the tool moves and mirrors those blocks directly, the same method as the command-line program jpegtran. Nothing is decoded and compressed again, and the camera's color profile and EXIF data stay in the file.",
            "**PNG:** saved pixel for pixel. Every color and transparent area is exactly what it was, only mirrored.",
            "**WebP:** re-saved at the highest quality. Solid pixels come out unchanged; partly transparent edges can shift very slightly. Safari can't save WebP files, so in Safari a WebP comes back as a PNG.",
          ],
        },
        {
          p: "Each image card says what happened to that file: lossless, re-saved, or saved as PNG.",
        },
      ],
    },
    {
      id: "trimmed",
      h2: "Why a flipped JPG can be a few pixels smaller",
      blocks: [
        {
          p: "Lossless JPG flipping only works on whole blocks of 8 or 16 pixels. When the width or height isn't a multiple of that block, the last partial block can't be mirrored without re-compressing it, so it is trimmed. That is at most 15 pixels from one edge: a 1600 × 902 photo flipped vertically comes out 1600 × 896.",
        },
        {
          p: 'The card shows the number of pixels trimmed. If every pixel matters, tick "Keep every pixel instead": the JPG keeps its full size and is saved once at 95% quality, which is very hard to tell apart from the original.',
        },
      ],
    },
    {
      id: "flip-rotate-mirror",
      h2: "Flip, rotate or mirror: what's the difference?",
      blocks: [
        {
          table: {
            head: ["Action", "What happens", "Use it when"],
            rows: [
              [
                "**Flip image horizontally**",
                "Left and right swap, as in a mirror. Text reads backwards",
                "A selfie came out reversed, or a design needs to face the other way",
              ],
              [
                "**Flip image vertically**",
                "Top and bottom swap. The picture is upside down and mirrored",
                "Reflections in water, or a scan that came out upside down and reversed",
              ],
              [
                "**Rotate image 90° or 180°**",
                "The picture turns. Nothing is mirrored and text still reads normally",
                "A phone photo is sideways or upside down",
              ],
            ],
          },
        },
        {
          p: '"Mirror an image" usually means a horizontal flip. A flipped picture is a mirror image of the original; a rotated one is not. If the photo is just sideways, rotate it instead of flipping it, or the text in it will read backwards.',
        },
      ],
    },
    {
      id: "selfie",
      h2: "My selfie came out backwards: how do I fix it?",
      blocks: [
        {
          p: "Front cameras show you a mirrored preview, like a bathroom mirror, because that's the face you're used to. Many phones then save the photo the way other people see you, so the saved selfie looks reversed compared with the preview. Other phones save the mirrored version, so writing on a T-shirt or a sign reads backwards.",
        },
        {
          ul: [
            "**To fix one you already took:** flip image horizontally here: add the selfie and press Flip horizontal.",
            "**To stop it happening on an iPhone:** turn on Settings › Camera › Mirror Front Camera to save selfies the way the preview shows them, or turn it off to save them the way others see you.",
            '**On Android:** the camera app\'s settings usually have a similar option, often called "Save selfies as previewed". The name differs by phone brand.',
          ],
        },
        {
          p: "A flip always applies to the whole picture. If you flip a selfie so the text reads correctly, your face is mirrored too. Flipping only the text and not the person needs an editor with layers.",
        },
      ],
    },
    {
      id: "uses",
      h2: "When you need to flip a picture",
      blocks: [
        {
          ul: [
            "**Iron-on transfers and T-shirt printing:** the design is printed mirrored so it reads correctly once pressed onto the fabric. Flip it horizontally before printing unless the printer software already does it.",
            "**Video call backgrounds:** your own view in Zoom or Teams is usually mirrored, so text on a background looks backwards to you but correct to everyone else. Check before you flip it.",
            "**Layouts and thumbnails:** a person facing off the edge of a page or banner feels wrong. A horizontal flip turns them toward the text.",
            "**Scans and screenshots:** documents scanned from the wrong side or upside down.",
          ],
        },
      ],
    },
    {
      id: "other-ways",
      h2: "How to flip an image in other apps",
      blocks: [
        {
          table: {
            head: ["App", "Where the flip is"],
            rows: [
              [
                "iPhone Photos",
                "Edit › Crop › the flip button in the top-left corner (horizontal only)",
              ],
              [
                "Windows Paint",
                "Image › Rotate › Flip horizontal or Flip vertical",
              ],
              ["Mac Preview", "Tools › Flip Horizontal or Flip Vertical"],
              [
                "Canva",
                "Select the image › Flip in the toolbar › Flip horizontal or Flip vertical",
              ],
              [
                "Google Docs",
                "No flip for pasted images: insert the image through Insert › Drawing › New, then Actions › Rotate › Flip horizontally",
              ],
            ],
          },
        },
        {
          p: "Built-in apps are quickest for one photo already on that device. This image flipper is quicker when you have several images, need a vertical flip on a phone, or want a JPG flipped without re-compression.",
        },
      ],
    },
    {
      id: "limits",
      h2: "Good for, not for",
      blocks: [
        {
          ul: [
            "**Good for:** when you need to flip image files or rotate them in batches of up to 10 photos, screenshots or graphics, with JPG quality kept.",
            "**Not for:** animated GIFs or animated WebP files, HEIC photos straight from an iPhone (convert them to JPG first), or flipping one part of a picture.",
            "**Know before you start:** images over 10 MB or 40 megapixels are refused so the browser tab doesn't run out of memory. Rare JPGs that use arithmetic coding or 12-bit color can't be flipped losslessly; they are re-saved at 95% quality and the card says so.",
          ],
        },
      ],
    },
  ],
  faqHeading: "FAQ",
  faq: [
    {
      q: "How do I flip an image horizontally?",
      a: "Add the image and press Flip horizontal, then download. Left and right swap, so the result is a mirror image of the original.",
    },
    {
      q: "How do I flip a picture upside down?",
      a: "Press Flip vertical. If you want it upside down but not mirrored, press Rotate right twice instead; that turns it 180°.",
    },
    {
      q: "Is this image flipper free? Is there a watermark?",
      a: "It's free, with no sign-up and no watermark, and batch download is included.",
    },
    {
      q: "Are my images uploaded?",
      a: "No. Flipping happens in your browser on your own device; the files are never sent to a server.",
    },
    {
      q: "How can I flip a photo without losing quality?",
      a: "Use a tool that flips JPGs losslessly, like this one, and keep PNGs as PNG. A JPG flipped here is not compressed again, and its color profile and EXIF data are kept.",
    },
    {
      q: "Does a flipped PNG keep its transparent background?",
      a: "Yes. PNG files are saved pixel for pixel, including every transparent and semi-transparent area.",
    },
    {
      q: "Can I flip several images at once?",
      a: "Yes, up to 10 at a time. They all get the same flip and download together as a ZIP file.",
    },
    {
      q: "Can I flip an image without flipping the text in it?",
      a: "Not with a whole-image flip. The text and everything else mirror together, so you need an editor with layers to flip only part of the picture.",
    },
    {
      q: "Why is my flipped JPG a few pixels smaller?",
      a: 'Lossless JPG flipping works in 8 or 16 pixel blocks, so a partial block at one edge is trimmed. Tick "Keep every pixel instead" to keep the full size at 95% quality.',
    },
    {
      q: "Can I flip an image on my phone?",
      a: "Yes, in any modern mobile browser. Tap the box to choose photos from your gallery; the buttons and preview work by touch.",
    },
    {
      q: "Can I flip a GIF?",
      a: "Not yet. Animated GIFs and animated WebP files are not supported.",
    },
  ],
  closing:
    "Done with the flip image step and need a different shape too? [Square an image](/free-tools/square-an-image) for posts or [crop an image into a circle](/free-tools/circle-crop-image) for avatars. For more, see the other [free tools](/free-tools) or browse the [Ordalin AI tool directory](/).",
};
