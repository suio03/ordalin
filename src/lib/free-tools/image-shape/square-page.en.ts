import type { ToolPageCopy } from "./page-copy";

// Facts: docs/keywords/square-an-image.md, "Verified product facts". Every claim maps to that list.
export const squarePageEn: ToolPageCopy = {
  title: "Square an Image: Make an Image Square Without Cropping, Free | Ordalin",
  description:
    "Square an image in your browser: fit the whole photo on a blurred or solid square, or crop it 1:1. Free, no upload or sign-up, never stretched.",
  h1: "Square an Image Without Cropping It",
  subtitle:
    "Square an image in your browser: fit the whole photo on a blurred or solid square, or crop it 1:1. Free, no upload or sign-up, never stretched.",
  sections: [
    {
      id: "how-to",
      h2: "How do you square an image?",
      blocks: [
        {
          ol: [
            "**Add a photo.** Drop it into the box above, or tap to pick one from your phone or computer.",
            "**Choose Fit or Crop.** Fit keeps the whole picture and fills the empty sides. Crop cuts a square out of it, and you drag and zoom to choose which part.",
            "**Set the fill, size and format, then download.** For Fit, pick a blurred background, white, black, transparent or your own color, and add padding if you want space around the photo.",
          ],
        },
        { p: "The preview updates as you change settings, so what you see is the square image you download." },
      ],
    },
    {
      id: "fit-or-crop",
      h2: "Fit or crop: which one do you need?",
      blocks: [
        {
          table: {
            head: ["Method", "What happens", "Use it when"],
            rows: [
              [
                "**Fit** (default)",
                "The whole photo sits in the middle of the square at its true shape; the empty sides are filled",
                "Nothing may be cut off: a group photo, a product shot, a poster, a screenshot with text near the edges",
              ],
              [
                "**Crop**",
                "A 1:1 area is cut from the photo; the rest is discarded",
                "The subject is in the middle and the edges don't matter, like a headshot for a profile picture",
              ],
              [
                "Stretch (not offered)",
                "The photo is forced into a square by squeezing it",
                "Never for photos: faces and circles turn into ovals",
              ],
            ],
          },
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
              ["What it is", "A free tool to make an image square, either by fitting it whole or by cropping it 1:1"],
              ["Photos it takes", "JPG, PNG or WebP, up to 10 MB and 40 megapixels"],
              ["Fill for Fit", "Blurred copy of the photo, white, black, transparent or any color, plus 0–20% padding"],
              ["Default size", "Fit: the photo's longer side (a 1200 × 1800 portrait becomes 1800 × 1800). Crop: the size of the square you select"],
              ["Other sizes", "1080, 2048 or 3000 px; never larger than 4096 px"],
              ["Formats", "PNG, WebP or JPG"],
              ["Where it runs", "In your browser. The photo is not sent to Ordalin or anyone else"],
            ],
          },
        },
      ],
    },
    {
      id: "squished",
      h2: "Why does a photo look squished when you make it square?",
      blocks: [
        {
          p: "Most resize boxes let you type the same width and height, and the program squeezes the picture to match. A 3:2 photo forced into 1:1 loses a third of its width, so people look thinner and round things turn into ovals.",
        },
        {
          p: "To make an image square the right way, keep the shape of every pixel. Either you add space to the short sides (Fit), or you remove some of the long side (Crop). This tool only does those two, so the result is never distorted.",
        },
      ],
    },
    {
      id: "fill",
      h2: "Choosing the fill for the empty sides",
      blocks: [
        {
          ul: [
            "**Blurred background** fills the sides with a soft, enlarged copy of the same photo. Colors match the picture, so the frame looks deliberate rather than empty.",
            "**White or black** gives a clean frame. White suits product photos and print; black suits dark photos and video thumbnails.",
            "**Transparent** leaves the sides empty, for a square image that goes on top of another background. Only PNG and WebP can store it.",
            "**Your own color** matches a brand or a page.",
            "**Padding** shrinks the photo inside the square, leaving an even border on all four sides.",
          ],
        },
      ],
    },
    {
      id: "sizes",
      h2: "What size to make a square image",
      blocks: [
        {
          ul: [
            "**Instagram feed posts:** 1080 × 1080 px is the standard square post size.",
            "**Profile pictures:** they are shown small, so 1080 px is more than enough for any site.",
            "**Music cover art:** distributors ask for square artwork, commonly 3000 × 3000 px. Check your distributor's own requirements before release.",
            "**Print or archive:** keep \"Original\", which uses every pixel the photo has.",
          ],
        },
        {
          p: "Choosing a size larger than the photo itself makes the tool upscale it, and you'll see a note that it will look softer. Picking a smaller size is always fine.",
        },
      ],
    },
    {
      id: "other-ways",
      h2: "Other ways to make a picture square",
      blocks: [
        {
          table: {
            head: ["Method", "Best when", "Not ideal when"],
            rows: [
              [
                "A browser tool like this one",
                "You want Fit with a blurred or colored fill, or an exact output size, on any device",
                "You need to square many photos at once (this tool takes one at a time)",
              ],
              [
                "iPhone Photos: Edit › Crop › aspect ratio › Square",
                "Cropping is fine and the photo is already on your phone",
                "You want to keep the whole picture; Photos has no fill option",
              ],
              [
                "Design apps",
                "The square is part of a larger layout with text or graphics",
                "You just need one squared photo quickly, without an account",
              ],
            ],
          },
        },
      ],
    },
    {
      id: "limits",
      h2: "Good for, not for",
      blocks: [
        {
          ul: [
            "**Good for:** one photo at a time, squared without distortion, for posts, avatars, covers and listings.",
            "**Not for:** batches, rounded corners or other aspect ratios such as 4:5. HEIC photos from an iPhone are not accepted; convert them to JPG first.",
            "**Know before you start:** images over 10 MB or 40 megapixels are refused so the browser tab doesn't run out of memory.",
          ],
        },
      ],
    },
  ],
  faqHeading: "FAQ",
  faq: [
    {
      q: "How do I make an image square without cropping?",
      a: "Keep the Fit mode. The whole picture stays visible and the tool fills the empty sides with a blurred copy of the photo, a solid color or transparency.",
    },
    {
      q: "Is it free? Is there a watermark?",
      a: "It's free with no sign-up and no watermark, and every option on the page is included.",
    },
    {
      q: "Are my photos uploaded?",
      a: "No. The photo is processed and saved by your browser on your own device; nothing is sent to a server.",
    },
    {
      q: "How do I add a blurred background to make a photo square?",
      a: "Choose Fit, then \"Blurred image\" under \"Fill the sides with\". The sides are filled with a soft, enlarged copy of the same photo.",
    },
    {
      q: "Can I square an image with a white background?",
      a: "Yes. In Fit mode pick White. Add padding if you want white on all four sides, not just two.",
    },
    {
      q: "Can I square an image with a transparent background?",
      a: "Yes. Pick Transparent and download PNG or WebP. JPG cannot store transparency, so the sides are filled with white instead.",
    },
    {
      q: "Will squaring an image lower its quality?",
      a: "Not at the default size, which keeps every pixel of the photo. Quality only drops if you choose a size larger than the photo, and the tool tells you when that happens.",
    },
    {
      q: "Can I make an image square on my phone?",
      a: "Yes, in any modern mobile browser. In Crop mode drag with one finger and pinch with two to zoom.",
    },
    {
      q: "What's the difference between a square image and a square crop?",
      a: "A square crop removes the parts of the photo outside the square. A square image made with Fit keeps the full photo and adds space to the short sides.",
    },
    {
      q: "Can I use the squared image commercially?",
      a: "Ordalin adds nothing to the image and claims no rights to it. Commercial use depends on who owns the original photo.",
    },
  ],
  closing:
    "Want a round version instead? Use the [circle crop image](/free-tools/circle-crop-image) tool for a transparent circle. For more, see the other [free tools](/free-tools) or browse the [Ordalin AI tool directory](/).",
};
