# square an image

- Market / language: US, English
- Page (Ordalin): /free-tools/square-an-image (`square an image`, `make image square`, `make image square without cropping`, `square image with blur`)
- Started: 2026-11-12
- Mode: default stops
- Now: all steps done; live 2026-11-12

## Steps

| # | Step | Status | Date | Output |
|---|---|---|---|---|
| 1 | SERP research | done | 2026-11-12 | [serp-square-an-image.md](../serp-square-an-image.md) |
| 2a | AI-search questions | done (maintainer confirmed 4 questions) | 2026-11-12 | [character-survey.md](../ai-search/2026-11-12-square-an-image/character-survey.md) |
| 2b | AI-search report | done | 2026-11-12 | [reference-audit.md](../ai-search/2026-11-12-square-an-image/reference-audit.md) |
| 3 | Feature requirements | done (confirmed + R11) | 2026-11-12 | below |
| 4 | Feature build | done — verified in browser, no paid model needed | 2026-11-12 | facts below |
| 5 | Structure and copy | done (approved: "可以") | 2026-11-12 | `src/lib/free-tools/image-shape/square-page.en.ts` (1189 words, main only); structure notes below |
| 6 | Examples wall | n/a (before/after samples instead) | | |
| 7 | Page implementation and internal links | done | 2026-11-12 | registry (group image, footer/header/sitemap/llms.txt), noindex removed, sibling links both ways, hub copy updated |
| 8 | Localization | done | 2026-11-12 | locales en, ja; docs/i18n/README.md; copy in src/lib/free-tools/image-shape/ |
| 9 | Pre-launch SEO | done | 2026-11-12 | Subagent (lyl-onpage-seo, fix mode): no blockers; fixed localized JSON-LD names and the /ja/free-tools breadcrumb |
| 10 | Launch report and commit | done | 2026-11-12 | Shipped to main (requested work ships, AGENTS.md 2026-11-05); Plausible goals "Circle Crop Download" / "Square Image Download" |

## Requirements (step 3, confirmed 2026-11-12)

| # | Requirement | Source | Must/later | Acceptance check |
|---|---|---|---|---|
| R1 | Two modes: **Fit** (whole image inside a square, default) and **Crop** (1:1 drag/zoom) | SERP main intent, AI-search SP1/SP4 | must | Landscape and portrait test photos work in both modes |
| R2 | Fit padding: blurred background / solid colour (white, black, custom) / transparent | SERP modifiers, AI-search SA7 | must | Each option exports correctly; blur fills the edges with no hard seam |
| R3 | Never stretch: aspect ratio always kept, no stretch mode | AI-search S-S4 | must | Output has the same subject proportions as the source (measured on a circle test image) |
| R4 | Output size: original (longest side), 1080, 2048, 3000 | SERP (Instagram, DistroKid), AI-search SA8 | must | Exports at exact pixel sizes |
| R5 | Optional padding around the image in Fit mode (0–20%) | squareimage.vip | must | Padding visible at 10% |
| R6 | Formats PNG / WebP / JPG (transparent padding falls back to white for JPG, with a note) | pixfy | must | JPG + transparent shows the note |
| R7 | Touch drag and pinch zoom in Crop mode | mobile use | must | Works on an iPhone-size viewport in Chrome device mode |
| R8 | Runs only in the browser, no upload, no sign-up, no watermark; 10 MB limit | competitors, pixfy | must | No image request in the network panel |
| R9 | UI strings in one copy file per locale (en first, then ja) | docs/i18n/README.md | must | `tsc` fails on a missing key |
| R11 | Input guard: max 10 MB and 40 megapixels; output capped at 4096 px; one image at a time. No server endpoint, no quota (nothing to abuse: all work runs in the visitor's browser) | maintainer asked about abuse, 2026-11-12 | must | 12000×9000 test image gets a clear error and the tab does not crash |
| L1 | Rounded corners, batch | squareimage.vip | later | |

## Verified product facts (step 4, 2026-11-12, banjo-003 Chrome on localhost)

Only these may be claimed on the page.

- Runs entirely in the browser: no fetch/XHR during load or download; no sign-up, no watermark.
- Input: JPG, PNG, WebP; max 10 MB and 40 megapixels (same guard as the circle tool).
- Fit mode (default): the whole image, no stretching, on a square; fill = blurred copy of the image / white / black / transparent / custom color; padding 0–20%.
  - 1200×1800 portrait → 1800×1800 PNG; blurred sides are opaque; transparent + 10% padding gives alpha-0 corners and edges.
- Crop mode: drag/zoom a 1:1 box inside the image (it cannot leave the image); 1200×1800 → 1200×1200.
- Output: original size (fit = long side, crop = crop side), presets 1080 / 2048 / 3000, capped at 4096 px; PNG / WebP / JPG, with the same upscale and JPG notes.
- Phone width: one column; touch drag and pinch shared with the circle tool.
- Code: `src/lib/free-tools/image-shape/`, `src/components/free-tools/image-shape/`.

## Decisions

- 2026-11-12: owner: "肯定是在这个网站做，接下来可能很长一段时间我们都是需要靠这些free小工具来获得流量。就按照你说的，先做 circl crop image 和 square an image。这些功能其实都做好了的。在同路径下的pixfy项目里面。你只需要调研页面的contents。代码可以直接copy或者稍微修改。但是landing page contents不要抄"
- 2026-11-12: owner on localization: "好的，按照你的建议来。但是关于多语言的方式，你还是看看同路径下的saybrush 和 tapemoon 是如何做的吧。" then chose option A: "好的，选A" — saybrush/tapemoon structure, locales opened per tool by demand. Plan: [docs/i18n/README.md](../i18n/README.md).
- 2026-11-12: owner: "还是要限制一下 不能被滥用吧？" → no server work, so no quota; input/output size guards added (R11).
- 2026-11-12: owner confirmed step 3 ("确认", plus the abuse guard) and said "好的。 继续吧" for step 4.

## Step 5 structure notes (2026-11-12)

- Copy lives in code (`src/lib/free-tools/image-shape/square-page.en.ts`, typed `ToolPageCopy`) so step 8 translates one object per locale; no separate landing-page doc.
- Differs from the template: no kicker, no examples wall (the live previews show the result), no pricing section (free, no tiers), no testimonials. Added a "fit vs crop" / "transparent vs color" decision section and a category comparison table (other ways), both from the SERP and AI-search gaps.
- Template sections kept: H1 + one-sentence definition, how-to steps, quick facts table, honest limits, FAQ in searched wording, closing with sibling + homepage links.
