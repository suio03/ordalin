# circle crop image

- Market / language: US, English
- Page (Ordalin): /free-tools/circle-crop-image (`circle crop image`, `crop image into circle`, `crop circle image`, `circle crop image with border`)
- Started: 2026-11-12
- Mode: default stops
- Now: all steps done; live 2026-11-12

## Steps

| # | Step | Status | Date | Output |
|---|---|---|---|---|
| 1 | SERP research | done | 2026-11-12 | [serp-circle-crop-image.md](../serp-circle-crop-image.md) |
| 2a | AI-search questions | done (maintainer confirmed 4 questions) | 2026-11-12 | [character-survey.md](../ai-search/2026-11-12-circle-crop-image/character-survey.md) |
| 2b | AI-search report | done | 2026-11-12 | [reference-audit.md](../ai-search/2026-11-12-circle-crop-image/reference-audit.md) |
| 3 | Feature requirements | done (confirmed + R11) | 2026-11-12 | below |
| 4 | Feature build | done — verified in browser, no paid model needed | 2026-11-12 | facts below |
| 5 | Structure and copy | done (approved: "可以") | 2026-11-12 | `src/lib/free-tools/image-shape/circle-page.en.ts` (1302 words, main only); structure notes below |
| 6 | Examples wall | n/a (before/after samples instead) | | |
| 7 | Page implementation and internal links | done | 2026-11-12 | registry (group image, footer/header/sitemap/llms.txt), noindex removed, sibling links both ways, hub copy updated |
| 8 | Localization | done | 2026-11-12 | locales en, ja, es, id; docs/i18n/README.md; copy in src/lib/free-tools/image-shape/ |
| 9 | Pre-launch SEO | done | 2026-11-12 | Subagent (lyl-onpage-seo, fix mode): no blockers; fixed localized JSON-LD names and the /ja/free-tools breadcrumb |
| 10 | Launch report and commit | done | 2026-11-12 | Shipped to main (requested work ships, AGENTS.md 2026-11-05); Plausible goals "Circle Crop Download" / "Square Image Download" |

## Requirements (step 3, confirmed 2026-11-12)

| # | Requirement | Source | Must/later | Acceptance check |
|---|---|---|---|---|
| R1 | Upload → drag/zoom inside a circle mask → download, in three steps | SERP, AI-search CP1/CP2, pixfy | must | 3 test photos done in ≤3 actions each |
| R2 | Default export is a transparent PNG (pixels outside the circle have alpha 0) | AI-search CP3/CP5 (Canva charges for this) | must | Exported PNG corner pixel alpha = 0, checked in code on 3 images |
| R3 | Original resolution by default (diameter = circle size in source pixels); presets 512 / 1080 / 2048 | AI-search CP4, roundcut | must | 4000×3000 source → diameter in the source-pixel range; presets give exact sizes |
| R4 | Background: transparent / white / black / custom colour | AI-search gap, autocomplete "with white/black background" | must | Each option exports the right fill outside the circle |
| R5 | Border: colour + width (0–5% of diameter) | autocomplete "with border", logo use | must | Border is drawn inside the canvas and not clipped, at 3 widths |
| R6 | Formats PNG / WebP (transparent), JPG (background colour forced, with a note) | pixfy, AI-search "PNG not JPG" | must | JPG with "transparent" selected shows the note and gets a white fill |
| R7 | Touch drag and pinch zoom on phones (pixfy is mouse-only) | AI-search CP6 | must | Works on an iPhone-size viewport in Chrome device mode |
| R8 | Runs only in the browser, no upload, no sign-up, no watermark; 10 MB limit; JPG/PNG/WebP input | competitors, pixfy | must | Network panel shows no image request; files over the limit get a clear error |
| R9 | Live preview on light and dark backgrounds | AI-search gap (corners turn white/black) | must | Preview shows both backgrounds |
| R10 | UI strings in one copy file per locale (en first, then ja/es/id) | docs/i18n/README.md | must | `tsc` fails on a missing key |
| R11 | Input guard: max 10 MB and 40 megapixels; output capped at 4096 px; one image at a time. No server endpoint, no quota (nothing to abuse: all work runs in the visitor's browser) | maintainer asked about abuse, 2026-11-12 | must | 12000×9000 test image gets a clear error and the tab does not crash |
| L1 | Batch, shapes other than circle | — | later | |

## Verified product facts (step 4, 2026-11-12, banjo-003 Chrome on localhost)

Only these may be claimed on the page.

- Runs entirely in the browser: no fetch/XHR during load, crop or download; no sign-up, no watermark.
- Input: JPG, PNG, WebP; max 10 MB and 40 megapixels (12000×9000 PNG → "This image is 108 megapixels. The limit is 40…").
- Drag to move, wheel / pinch / slider / ± buttons / arrow and +/- keys to zoom; the circle can zoom out past the image edge.
- Default export: PNG at the crop's own pixels (e.g. 1913 px), corners alpha 0. Presets 512 / 1080 / 2048; output capped at 4096 px; a note warns when a preset upscales.
- Outside the circle: transparent / white / black / custom color (black JPG corner = 0,0,0).
- Border 0–5% of the diameter, any color, drawn inside the edge (3% white border verified at the edge).
- Formats PNG / WebP / JPG; JPG with transparent shows a note and fills white.
- Live preview on a light and a dark page.
- Phone width (390 px): one column, no horizontal scroll; touch drag and two-finger pinch work.
- Code: `src/lib/free-tools/image-shape/`, `src/components/free-tools/image-shape/`; 11 geometry unit tests.

## Decisions

- 2026-11-12: owner: "肯定是在这个网站做，接下来可能很长一段时间我们都是需要靠这些free小工具来获得流量。就按照你说的，先做 circl crop image 和 square an image。这些功能其实都做好了的。在同路径下的pixfy项目里面。你只需要调研页面的contents。代码可以直接copy或者稍微修改。但是landing page contents不要抄"
- 2026-11-12: owner on localization: "好的，按照你的建议来。但是关于多语言的方式，你还是看看同路径下的saybrush 和 tapemoon 是如何做的吧。" then chose option A: "好的，选A" — saybrush/tapemoon structure, locales opened per tool by demand. Plan: [docs/i18n/README.md](../i18n/README.md).
- 2026-11-12: owner: "还是要限制一下 不能被滥用吧？" → no server work, so no quota; input/output size guards added (R11).
- 2026-11-12: owner confirmed step 3 ("确认", plus the abuse guard) and said "好的。 继续吧" for step 4.

## Step 5 structure notes (2026-11-12)

- Copy lives in code (`src/lib/free-tools/image-shape/circle-page.en.ts`, typed `ToolPageCopy`) so step 8 translates one object per locale; no separate landing-page doc.
- Differs from the template: no kicker, no examples wall (the live previews show the result), no pricing section (free, no tiers), no testimonials. Added a "fit vs crop" / "transparent vs color" decision section and a category comparison table (other ways), both from the SERP and AI-search gaps.
- Template sections kept: H1 + one-sentence definition, how-to steps, quick facts table, honest limits, FAQ in searched wording, closing with sibling + homepage links.
