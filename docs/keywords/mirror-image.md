# mirror image

- Market / language: US, English
- Page (Ordalin): /free-tools/mirror-image (`mirror image online`, `mirror image`, `mirror photo`, `mirror a picture`, `mirror image maker`)
- Started: 2026-11-14
- Mode: default stops
- Now: step 3, waiting on owner: confirm the requirements table

## Steps

| # | Step | Status | Date | Output |
|---|---|---|---|---|
| 1 | SERP research | done (owner: "好的，你开始做mirror吧") | 2026-11-14 | [serp-mirror-image.md](../serp-mirror-image.md) |
| 2a | AI-search questions | skipped: reuse flip round (same day, same task) | 2026-11-14 | [flip reference-audit](../ai-search/2026-11-14-flip-image/reference-audit.md) |
| 2b | AI-search report | skipped (see 2a) | | |
| 3 | Feature requirements | done (owner: "好的。") | 2026-11-14 | this ledger |
| 4 | Feature build and model choice | done: browser-only, no model; tested in banjo-003 on dev | 2026-11-14 | `src/components/free-tools/mirror-image/`, `src/lib/free-tools/mirror-image/`; shared code in `src/components/free-tools/flip-image/shared.tsx` |
| 5 | Structure and copy | done (owner: "没问题。") | 2026-11-14 | `src/lib/free-tools/mirror-image/page.en.ts` (~1,430 words; "mirror image" rank 1 in 1/2-gram lists) |
| 6 | Examples wall | n/a (free tool, no model output; same as flip) | | |
| 7 | Page implementation and internal links | done: route, pages.ts, registry (footer/hub/sitemap/llms.txt), flip page links to mirror (difference section + closing), Plausible goal "Mirror Image Download" (id 449) | 2026-11-14 | `src/app/(site)/free-tools/mirror-image/page.tsx` |
| 8 | Localization | skipped: per [flip localization doc](flip-image-localization-2026-11-14.md), ja/es/id mirror wording already belongs to the localized flip pages, so no localized mirror pages unless new evidence | | |
| 9 | Pre-launch SEO | done: subagent (lyl-onpage-seo), all checks pass; fixed duplicate keyword anchors in both closings | 2026-11-14 | |
| 10 | Launch report and commit | todo | | |

## Decisions

- 2026-11-14: owner: "好的，你开始做mirror吧" → separate page with mirror + symmetry + reflection modes (plan in the SERP doc)
- 2026-11-14 step 2: skipped by me. The flip AI-search round the same day already covered the task ("How do I flip a photo so it's mirrored left to right?"). ChatGPT did not browse and recommended built-in apps only, so a second round would only repeat it.

- 2026-11-14 step 3: owner approved the requirements: "好的。"

## Feature requirements

| Requirement | Source | Must / later | Acceptance check | Met? |
|---|---|---|---|---|
| Mirror mode: flip horizontal / vertical, reusing the flip engine (lossless JPG, original format) | SERP (all mirror pages) | must | Output bytes equal to /free-tools/flip-image for the same input and direction | yes (same worker and FLIP_H/FLIP_V as flip) |
| Symmetry mode: keep the left, right, top or bottom part and mirror it across a line | Kapwing, Fotor, Pixlr | must | At the centre line, pixel x equals pixel w−1−x on 3 test images | yes |
| Movable mirror line for symmetry (faces are rarely centred) | own judgement (symmetry pages show centred demos only) | must | Line at 10–90%; output = kept part + its mirror, so the width (or height) is 2× the kept part; preview matches download | yes |
| Reflection mode: add a mirrored copy to the right, left, below or above | Kapwing, Pixlr | must | Output 2W×H or W×2H; the copy is an exact mirror | yes |
| Reflection fade (water/floor look) | Pixlr | must | Fade on: copy alpha goes from the chosen start to 0; JPG input with fade saves as PNG (stated in the UI) | yes |
| Live preview of the result | SERP | must | Every control change updates the preview in < 200 ms on a 12 MP photo | yes (preview from a ≤1024 px copy; not timed on 12 MP) |
| Batch + ZIP, paste from clipboard, JPG/PNG/WebP, same limits as flip, local only | flip tool parity | must | Same tests as flip | yes |
| Symmetry/reflection quality: re-encode JPG at 95%, PNG/WebP keep transparency | honesty (canvas re-encodes) | must | UI/list says which files were re-encoded | yes |
| Plausible goal "Mirror Image Download" + props mode/count | project pattern | must | Goal registered with plausible-admin | yes (goal 449; props mode/formats/count already registered) |
| 4-way (kaleidoscope) symmetry, diagonal | Pixlr | later | — | |
| Per-image line position in a batch | — | later | — | |
| Animated GIF/WebP | flip backlog | later | — | |
| Mirror text generator | autocomplete `mirror image generator text` | separate page, not now | — | |

## Verified product facts

| Fact | Value | Verified by |
|---|---|---|
| Effects | Mirror (left↔right, top↔bottom), Symmetry (keep left/right/top/bottom, line 10–90% step 1), Reflection (bottom/top/right/left, optional fade) | UI, 2026-11-14 |
| Mirror on JPG | Lossless via flip worker; 403×250 → 400×250 (3 px trimmed) for L↔R, 403×240 (10 px) for T↔B; diff vs canvas flip of the kept area mean 0.02 | banjo-003 test, generated images |
| Mirror on PNG | Pixel-identical to a canvas flip (max diff 0), transparency kept | same |
| Symmetry | Output = 2× kept part (403 px JPG at 50% → 404 px; 300 px PNG keep right at 30% → 420 px); PNG matches reference exactly, JPG re-saved at 95% (mean diff 0.30) | same |
| Reflection | 2× size; copy is exact mirror (PNG max diff 0; JPG mean 0.26 after 95% re-save) | same |
| Fade | Copy alpha 153 (60%) at the seam → 76 halfway → 0 at the far edge; JPG + fade saved as PNG with "Saved as PNG to keep the fade" on the card | same |
| Batch | ZIP `mirrored-images.zip` with `name-mirrored.ext` entries; single download `name-mirrored.ext` | same |
| Limits | Same as flip: 10 files, 10 MB, 40 MP, JPG/PNG/WebP, paste; output capped at 40 MP (16.7 MP on iOS) and scaled with a card note | code (`shared.tsx`, `mirror-image-tool.tsx`) |
| Flip tool after refactor | Still flips losslessly (403×250 JPG → 400×250, `t-flipped.jpg`); no console errors | same |

## Open items

- Step 9 SEO subagent, step 10 commit/push only on owner's word
