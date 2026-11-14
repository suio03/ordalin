# flip image

- Market / language: US, English
- Page (Ordalin): /free-tools/flip-image (`flip image`, `image flip`, `image flipper`, `flip picture`, `flip photo online`)
- Started: 2026-11-14
- Mode: default stops
- Now: done (live 2026-11-14, 4cc40be). Next: /free-tools/mirror-image and rotate tool (owner-approved, separate pages)

## Steps

| # | Step | Status | Date | Output |
|---|---|---|---|---|
| 1 | SERP research | done | 2026-11-14 | [serp-flip-image.md](../serp-flip-image.md) |
| 2a | AI-search questions | done (maintainer confirmed 4 questions) | 2026-11-14 | [character-survey.md](../ai-search/2026-11-14-flip-image/character-survey.md) |
| 2b | AI-search report | done | 2026-11-14 | [reference-audit.md](../ai-search/2026-11-14-flip-image/reference-audit.md) |
| 3 | Feature requirements | done (maintainer confirmed) | 2026-11-14 | this ledger |
| 4 | Feature build and model choice | done (no model; browser-only) | 2026-11-14 | `src/lib/free-tools/flip-image/`, `src/components/free-tools/flip-image/` |
| 5 | Structure and copy | done (owner: "好的。下一步") | 2026-11-14 | `src/lib/free-tools/flip-image/page.en.ts` (1570 words rendered incl. tool UI; `flip image` 2-gram rank 1, `image flipper` ×4) |
| 6 | Examples wall | n/a (skipped, like square) | | |
| 7 | Page implementation and internal links | done | 2026-11-14 | registry (group image → footer/header/hub/sitemap/llms.txt), hub copy, square + circle closings link here, Plausible goal "Flip Image Download" + props change/formats/lossless/count |
| 8 | Localization | done: ja (画像 反転), es (voltear imagen), id (mirror foto) + es/id hubs; de, pt-BR not opened; fr skip | 2026-11-14 | [flip-image-localization-2026-11-14.md](flip-image-localization-2026-11-14.md), `src/lib/free-tools/flip-image/page.{ja,es,id}.ts`, `ui-copy.ts` |
| 9 | Pre-launch SEO | done (subagent: no blockers; es/id titles shortened) | 2026-11-14 | `pnpm seo:check` on prod: all ok |
| 10 | Launch report and commit | done: en + ja/es/id + es/id hubs live | 2026-11-14 | 4cc40be |

## Decisions

- 2026-11-14 step 8: owner: "ja，再开 es 和 id 就这三个就好了。 直接 做好 然后一起上线。" → ja/es/id only; ship together with en
- 2026-11-14 step 5: owner: "好的。下一步" → draft approved, examples wall skipped
- 2026-11-14 step 3: owner: "可以。" → requirements table above approved, incl. free feasibility spike for lossless JPEG

- 2026-11-14: owner: "准备做这个free 的工具。 你看看，代码在同路径的pixfy。 但是 landing page 的内容需要你去调研"
- 2026-11-14 step 1: owner: "1. 单独做 2. 单独做 3. 按照你的建议走。开始吧" → `mirror image` and `rotate picture online` get their own pages later; must-haves add batch + ZIP, paste from clipboard, keep original format; animated GIF later

## Feature requirements

| Requirement | Source | Must / later | Acceptance |
|---|---|---|---|
| Flip H / V / both, rotate ±90° | SERP, ChatGPT | must | 4 combos correct on 3 test images |
| Live preview, touch-friendly | SERP | must | full flow works at 390px width |
| Keep original format + size, transparency kept | SERP, ChatGPT | must | PNG/WebP same size + alpha; JPEG quality 0.95 |
| Batch + ZIP | owner | must | 10 files, ZIP names/formats correct |
| Paste from clipboard | owner | must | Cmd+V screenshot loads |
| Local only, no sign-up, no watermark | SERP | must | no upload requests while processing |
| Size guard (10 MB / 40 MP) | pixfy | must | clear message, no freeze |
| Lossless JPEG flip in browser | ChatGPT gap | evaluate | feasibility spike: pixels match jpegtran; if not, skip and say so honestly |
| Animated GIF/WebP | SERP | later | — |

### Raw (from SERP)

Flip horizontal / vertical / both; rotate 90°; live preview; keep size and original format (PNG/JPG/WebP), transparency kept; local processing, no sign-up, no watermark. Optional: batch + ZIP, paste from clipboard, animated GIF/WebP.

## Structure (step 5)

Template minus examples wall (step 6 likely n/a, like square) and use-case cards. Added from research: quality section + JPG trim explainer (ChatGPT F-Q4 gap, lossless is the unique point), flip/rotate/mirror table (SERP confusion), backwards selfie section in F-Q3's words (Mirror Front Camera), uses (iron-on, Zoom background), short other-apps table (AI Overview + `how to flip an image in canva/google docs`), honest limits. Mirror and rotate keywords mentioned once each; they get their own pages.

## Verified product facts

Only these may be claimed on the page (verified 2026-11-14 in Chrome + Node tests).

- Runs entirely in the browser; files never leave the device. No sign-up, no watermark.
- Flip horizontal, flip vertical, rotate left/right 90°, any combination (8 orientations); live preview; reset.
- JPG: lossless transform in a Web Worker (DCT-block rearrangement, no re-compression). Decoded pixels equal `jpegtran -trim` (max diff 0, flip V and rotate 90 checked on a 1600×902 photo). EXIF orientation folded in; ICC/EXIF/XMP kept. Baseline + progressive, 4:2:0/4:2:2/4:4:4 covered by 16 tests. ~0.25 s for 12 MP (Node).
- Lossless JPG may trim up to 15 px from one edge (partial 8/16 px block); the card shows "{n} px edge trimmed". Option "Keep every pixel instead" re-saves at 95% quality with the full size.
- Unsupported JPGs (arithmetic coding, 12-bit) fall back to canvas at 95% quality and say so.
- PNG: pixel-exact, transparency kept (max diff 0).
- WebP: re-saved at the highest quality; opaque pixels exact, semi-transparent pixels can shift slightly. Do not call WebP lossless. Safari can't encode WebP → saved as PNG, card says so.
- Limits: 10 images per batch, 10 MB and 40 MP each; JPG/PNG/WebP in.
- Batch: one orientation for all; single file → `name-flipped.ext`, several → `flipped-images.zip`.
- Paste a screenshot with Cmd/Ctrl+V; drag and drop.
- Mobile: full flow at 390 px, no horizontal scroll.
- Not supported: animated GIF/WebP (later), HEIC input.

## Open items

- Later pages (approved 2026-11-14): `/free-tools/mirror-image`, rotate tool — after flip image ships
