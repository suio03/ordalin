# SERP research: mirror image (vs flip image)

- Market / language: US, English; 2026-11-14
- Sources: Google SERP (banjo-003 Chrome, hl=en, gl=us, pws=0), Google autocomplete, HTML fetch of the ranking mirror pages (Canva, Adobe, freebeat blocked the fetch). Earlier flip-image SERP: [serp-flip-image.md](serp-flip-image.md).
- Not done: Semrush volume for `mirror image`. The sem.3ue.com mirror redirected to its dashboard, and the dashboard forbids automated access, so it was not retried. Earlier numbers from the maintainer's sheets still apply: the GKP bucket `mirroring pictures` is 10K–100K, and Semrush lists `mirror of image` and `mirror an image` as clusters.

## Conclusion

- **Make it a separate page.** Canva, Adobe and Picsart each rank a separate `/mirror-image` URL for the mirror queries and their `/flip-image` URL for `flip image`. Google wants a mirror-specific page.
- **Few shared results.** Comparing exact URLs, the mirror queries share only 1 result with `flip image` (pinetools/flip-image), out of 8–9.
- **`mirror image` alone is mixed intent.** About half of its top 8 is not a tool: two D&D spell pages, Wikipedia, and a company. Autocomplete is dominated by 5e/dnd/twins/twilight zone. The tool-intent heads are `mirror image online`, `mirror a picture`, `mirror photo` and `mirror image maker`. Target `mirror image online` and keep `mirror image` in the title/H1.
- **Needs its own feature.** Most ranking mirror pages are the same flip tool with mirror wording (resizepixel, Picsart, imagetotext, much of Fotor). The stronger pages add a mirror effect:
  - Kapwing: "Make perfectly symmetrical pictures", "adding a reflection".
  - Fotor: "Ideal Mirror Filter to Create Stunning Symmetry Art".
  - Pixlr: reflections, symmetry and kaleidoscope, in vertical and diagonal variants.
  A copy of our flip tool with new text would be a thin near-duplicate of /free-tools/flip-image. The mirror page should ship flip **plus** symmetry and reflection modes.

## Results by query (top organic, host/path)

| Query | Results | Shared with `flip image` (exact URL) |
|---|---|---|
| mirror image | resizepixel/mirror-image, roll20 D&D, canva/mirror-image, dndbeyond, mirrorimageinc.com, Wikipedia, adobe/mirror, pinetools/flip-image | 1/8 |
| mirror image online | resizepixel, canva/mirror-image, pinetools/flip-image, freebeat/mirror-picture, imagetotext/mirror-image, adobe/mirror, lunapic, picsart/mirror, kapwing/mirror | 1/9 |
| mirror photo | canva/mirror-image, resizepixel, App Store (Photo Mirror), fotor/mirror-image, Google Play (Mirror Photo Editor & Collage), adobe/mirror, freebeat, imagetotext | 0/8 |
| mirror a picture | canva/mirror-image, resizepixel, adobe/mirror, Play (Flip Image - Mirror Image), freebeat, picsart/mirror, YouTube (Android), thefacereport true mirror | 1/8 (Play app) |
| mirror effect photo | canva/mirror-image, freebeat, App Store (Mirror Effects), pixlr/mirror-image (reflections), Play app, adobe/mirror, img2go/rotate, fotor/mirror-image | 1/8 (Play app) |
| flip image (baseline) | pinetools/flip-image, canva/flip-image, Play app, picsart/flip-image, adobe/flip, imagy, flip-image.com, photoaid/flip | — |

People also ask (mirror image): "What does the saying mirror image mean?" and "What is a mirror image?". These are definition questions; answer them in one FAQ.

## Autocomplete

| Seed | Useful | Other intents (skip) |
|---|---|---|
| mirror image online | free, editor, tool, converter, text | camera / live / test (webcam mirror) |
| mirror a picture | online; in powerpoint / word / canva / photoshop / ppt; on iphone; android | picture frame |
| mirror image maker | online, mirror photo maker, flip image maker, how to convert image to mirror image | text generator |
| mirror photo | on iphone, photoshop | photo booth (rental), photography, photoshoot |
| mirror effect | photo, procreate | paint, nails, psychology |

## Ranking mirror pages (fetched)

| Page | Words | Shape |
|---|---|---|
| resizepixel.com/mirror-image | 431 | plain flip; H2 "Why mirror an image?", how-to |
| tools.picsart.com/image/mirror | 1008 | flip; FAQ "What is a mirror image?" |
| kapwing.com/tools/mirror/image | 1653 | flip + symmetry + reflection; FAQ "Are photographs reverse images?", iPhone how-to |
| fotor.com/features/mirror-image | 2413 | flip H/V, selfie fix, symmetry filter, text-orientation use |
| pixlr.com/effects/mirror-image | 1336 | reflection effects, symmetry, kaleidoscope, mockups |
| imagetotext.cc/mirror-image | 470 | plain flip |

## Page plan

- Path `/free-tools/mirror-image`. Target `mirror image online` and `mirror image`; twins `mirror photo` and `mirror picture`.
- Tool modes:
  1. **Mirror**: horizontal or vertical flip, reusing the flip engine (lossless JPG).
  2. **Symmetry**: copy the left, right, top or bottom half onto the other side.
  3. **Reflection**: add a mirrored copy beside or below, with an optional fade.
- Content: what a mirror image is (the PAA question), mirror vs flip vs symmetry, selfie un-mirror, printing/iron-on, in-app how-tos (PowerPoint, Word, iPhone, Android, Canva) kept short.
- Skip: live webcam mirror / "true mirror" camera, D&D, photo booths, mirror text (could be its own later page; `mirror image generator text` shows up).
- Link with /free-tools/flip-image both ways. The flip page's single "mirror" mention becomes the link.
