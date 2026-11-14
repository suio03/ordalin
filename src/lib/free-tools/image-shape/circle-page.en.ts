import type { ToolPageCopy } from "./page-copy";

// Facts: docs/keywords/circle-crop-image.md, "Verified product facts". Every claim maps to that list.
export const circlePageEn: ToolPageCopy = {
  title:
    "Circle Crop Image: Crop an Image Into a Circle, Free Transparent PNG | Ordalin",
  description:
    "Circle crop image files in your browser: place a photo in a circle and download a transparent PNG. Free, with no upload, sign-up or watermark.",
  h1: "Circle Crop Image With a Transparent Background",
  subtitle:
    "Circle crop image files in your browser: place a photo in a circle and download a transparent PNG. Free, with no upload, sign-up or watermark.",
  sections: [
    {
      id: "how-to",
      h2: "How do you circle crop an image?",
      blocks: [
        {
          ol: [
            "**Add a photo.** Drop it into the box above, or tap to choose one from your phone or computer.",
            "**Place the circle.** Drag the image to move it, and zoom with the slider, the mouse wheel or two fingers until the part you want sits inside the ring. You can zoom out past the edge of the photo to fit a wide shot whole.",
            "**Pick the finish and download.** Keep the corners transparent or fill them with a color, add a border if you like, choose a size and format, then download the circle crop image.",
          ],
        },
        {
          p: "The two previews show the result on a white page and on a dark page, so you can see the edge before you download.",
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
                "A free tool to crop an image into a circle and save it as its own file",
              ],
              [
                "Photos it takes",
                "JPG, PNG or WebP, up to 10 MB and 40 megapixels",
              ],
              [
                "Default download",
                "PNG with fully transparent corners, at the pixel size of the area inside the circle",
              ],
              [
                "Other sizes",
                "512, 1080 or 2048 px across; never larger than 4096 px",
              ],
              ["Formats", "PNG, WebP or JPG"],
              [
                "Outside the circle",
                "Transparent, white, black or any color you pick",
              ],
              [
                "Border",
                "Optional ring of any color, from 0.5% to 5% of the width",
              ],
              [
                "Where it runs",
                "In your browser. The photo is not sent to Ordalin or anyone else",
              ],
            ],
          },
        },
      ],
    },
    {
      id: "background",
      h2: "Transparent corners or a solid color?",
      blocks: [
        {
          p: "A circle crop image is still saved as a square file. The four corners outside the circle have to be something: either empty (transparent) or a color. Pick based on where the picture is going.",
        },
        {
          ul: [
            "**Transparent** is right for slides, documents, websites, stickers and logos, where the page behind should show through. Only PNG and WebP can store it.",
            "**White or black** is safer for apps that don't support transparency. Some programs show empty corners as solid black or white boxes, which looks like a mistake. Matching the fill to the page avoids that.",
            "**A custom color** turns the corners into a deliberate backdrop, which works for a brand color behind a team photo.",
          ],
        },
        {
          p: "If a site already shows profile pictures in a circle, such as WhatsApp, Discord or LinkedIn, it crops the square for you, so the corners never show. Using the tool first still helps: you choose exactly what stays inside the ring instead of letting the site guess.",
        },
      ],
    },
    {
      id: "sharp",
      h2: "Keep the circle crop sharp",
      blocks: [
        {
          p: 'Blurry circles usually come from making the picture bigger than the photo really is. The size menu shows how many pixels the circle covers in your photo, and "Original" keeps exactly that, so nothing is stretched.',
        },
        {
          ul: [
            "Start from the original photo, not a screenshot or an image saved from a chat app, which are often shrunk.",
            "Zooming in far means the circle covers fewer real pixels. If the original size drops below what you need, use a wider crop or a larger photo.",
            "When you pick a size larger than the circle covers, the tool warns that the picture will be upscaled and look softer.",
            "Use PNG for logos, text and flat colors. JPG is fine for photos with a solid background, and smaller.",
          ],
        },
      ],
    },
    {
      id: "uses",
      h2: "What people crop into a circle",
      blocks: [
        {
          ul: [
            "**Profile pictures:** a round pfp for WhatsApp, Discord, Slack or a forum, centered on your face rather than wherever the site decides.",
            "**Logos and badges:** a circle crop with a border and transparent corners, ready to place on a site, a slide or a product shot.",
            "**Team and speaker pages:** the same circle style for every headshot, so a row of faces lines up.",
            "**Slides and documents:** round photos that sit on any background color without a white box around them.",
          ],
        },
      ],
    },
    {
      id: "other-ways",
      h2: "Other ways to crop a picture into a circle",
      blocks: [
        {
          table: {
            head: ["Method", "Best when", "Not ideal when"],
            rows: [
              [
                "A browser tool like this one",
                "You want a separate round image file, transparent or on a color, from any device",
                "You need to edit many images at once (this tool takes one at a time)",
              ],
              [
                "PowerPoint or Word: Picture Format › Crop › Crop to Shape › Oval",
                "The circle only needs to live inside that slide or document",
                "You need the circle as a file; the photo stays a rectangle under the shape",
              ],
              [
                "Google Slides: the arrow next to Crop › Mask image › Shapes › Oval",
                "You are already building slides in Google",
                "The photo isn't square: the mask becomes an oval until you crop it square first",
              ],
              [
                "Design apps with circle frames",
                "The circle is part of a larger design",
                "You only need one round file and don't want an account or a paid export for transparency",
              ],
              [
                "iPhone Photos",
                "A square crop is enough, because the app you post to rounds it",
                "You need an actual circle: Photos crops to a square at most",
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
            "**Good for:** one circle crop image at a time, clean enough to reuse anywhere.",
            "**Not for:** other shapes, ovals, or many photos in one go. HEIC photos from an iPhone are not accepted; convert them to JPG first.",
            "**Know before you start:** images over 10 MB or 40 megapixels are refused so the browser tab doesn't run out of memory. Resize huge camera files first.",
          ],
        },
      ],
    },
  ],
  faqHeading: "FAQ",
  faq: [
    {
      q: "Is this circle crop tool free?",
      a: "Yes. There is no sign-up, no watermark and no paid tier, and the transparent PNG download is included.",
    },
    {
      q: "How do I crop an image into a circle with a transparent background?",
      a: 'Leave "Outside the circle" on Transparent and download as PNG or WebP. Everything outside the ring is saved as empty pixels, so it shows whatever is behind it.',
    },
    {
      q: "Why are the corners of my circle white or black?",
      a: "Either the file was saved as JPG, which cannot hold transparency, or the app you opened it in draws empty pixels as a color. Download a PNG, or fill the corners with the color of the page it will sit on.",
    },
    {
      q: "Are my photos uploaded?",
      a: "No. The photo is read, cropped and saved on your device by your browser. Nothing is sent to a server, so it also works on private photos.",
    },
    {
      q: "Can I add a border to the circle?",
      a: "Yes. Move the border slider to set the width and pick a color. The ring is drawn inside the edge of the circle, so it is never cut off.",
    },
    {
      q: "What size should a round profile picture be?",
      a: 'Profile photos are shown small, so 512 or 1080 px across is plenty for most sites. Keep "Original" if you want the most detail the photo has.',
    },
    {
      q: "Does it work on iPhone and Android?",
      a: "Yes, in the phone's browser. Drag with one finger and pinch with two to zoom, then download to your photos or files.",
    },
    {
      q: "Can I crop an image into a circle if it's wide or tall?",
      a: "Yes. Move the circle over any part of it, or zoom out until the whole photo fits inside the ring; the empty space around it follows your background choice.",
    },
    {
      q: "Which formats can I download?",
      a: "PNG, WebP and JPG. PNG and WebP keep transparent corners; JPG fills them with white unless you pick a color.",
    },
    {
      q: "Can I use the result commercially?",
      a: "Ordalin adds nothing to the image and claims no rights to it. Whether you can use it commercially depends on who owns the original photo.",
    },
  ],
  closing:
    "Need the whole photo as a square instead of a circle? [Square an image](/free-tools/square-an-image) without cropping it, or [flip the image](/free-tools/flip-image) first if it faces the wrong way. For more, see the other [free tools](/free-tools) or browse the [Ordalin AI tool directory](/).",
};
