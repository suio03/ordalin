# pptx viewer: renderer benchmark (step 4)

- Date: 2026-11-16. Desktop Chrome (banjo-003), local Vite harness, each library in its own iframe beside the author's PDF (pdfjs).
- Decks and harness are kept out of Git (licences differ); they live in the session scratchpad. Source URLs below.

## Result

**Pick: `@aiden0z/pptx-renderer` 1.4.0** (Apache-2.0). It was closest to the PDF on all 8 real decks and was the only library that drew every native chart with its type, stacking and axes right. It also keeps `normAutofit` text inside its boxes. It exposes `Slide.hidden` and `searchPresentation`. It does not expose speaker notes; we parse `ppt/notesSlides` ourselves.

| Library | gzip (min) | Fidelity on 8 real decks | Verdict |
|---|---|---|---|
| `@aiden0z/pptx-renderer` 1.4.0 | 405 KB (incl. echarts) | Best. Charts, tables, masters, crops, groups and 4:3 right. Faults listed below | **use** |
| `@diceui/pptx-core` 0.4.1 | 365 KB | Same as aiden0z on 01, but on 02 ignores autofit font scaling, so text overflows its boxes on ~15 slides | drop |
| `pptx-glimpse` 5.3.1 | 275 KB | Layout good. Charts often wrong: 01 area/combo charts drawn as lines, 03 100% stacked bar drawn clustered. Table fills lost, 04 bullets lost, 07 titles lose bold. Useful diagnostics API | drop (keep as idea for diagnostics) |
| `@file-viewer/pptx` 3.3.3 | 32 KB | Charts blank, wrong slide heights | drop after synthetic + 01 |
| `pptx-viewer` 0.2.2 | 32 KB | 01: same chart drawn on every slide; group offsets wrong | drop after synthetic + 01 |

Speed: no difference that matters. The 120-slide, 30 MB synthetic deck parsed and rendered all slides in 0.3–0.6 s (aiden0z 377 ms, diceui 325 ms, glimpse 601 ms). The slowest real deck took 1.7 s (05, 22 MB, large PNGs).

## aiden0z faults to handle in our build

| Fault | Deck | Plan |
|---|---|---|
| TIFF pictures not shown (browsers don't decode TIFF) | 06 (7 TIFFs) | decode TIFF to PNG ourselves (small decoder, lazy) or list it under "not rendered" |
| SVG icons with PNG fallback drawn as black circles | 02 slide 4 | check `asvg:svgBlip` vs fallback; else list under "not rendered" |
| Combo charts: uncertainty band + lines drawn as solid area | 01 (some charts) | accept; readable |
| Non-system fonts fall back, so lines wrap differently (Eras Light ITC, Proxima Nova) | 05, 06 | "missing font → substitute" line in the not-rendered list; metric fonts stay "later" |
| A shape with an entrance animation drawn faded | 05 slide 4 | render final state; check |
| Speaker notes not exposed | all | parse `ppt/notesSlides/*.xml` |

## Test decks

| File | Source | Licence | Slides / PDF pages | Covers |
|---|---|---|---|---|
| 01-eia-aeo2023 | eia.gov/outlooks/aeo (AEO2023_Release_Presentation .pptx/.pdf) | US public domain | 25 / 25 | 29 native charts, table, custom master |
| 02-ofsted-childcare-briefing | gov.uk pre-registration briefing for childcare providers | OGL v3.0 | 47 / 47 | SmartArt, tables, SVG icons, gradients, Tahoma |
| 03-charity-commission-apm2022 | gov.uk Helen Stephenson APM 2022 presentation | OGL v3.0 | 26 / 26 | bar charts, 51 photos, Montserrat |
| 04-ofqual-qualifications-reform | gov.uk qualifications reform resources for teachers | OGL v3.0 | 28 / 28 | 2 masters / 30 layouts, tables, Roboto |
| 05-mit-ai101 | ocw.mit.edu RES-6-013 AI 101 | CC BY-NC-SA 4.0 | 54 / 54 | 37 cropped pictures, animations, Eras Light ITC |
| 06-mit-cms595-ses1 | ocw.mit.edu CMS.595 lecture slides, session 1 | CC BY-NC-SA 4.0 | 23 / 23 | TIFF pictures, many non-system fonts |
| 07-dbbook-ch3-sql | db-book.com slides (ch3) | personal/course use | 62 / 62 | 4:3, long deck, nested groups |
| 08-dbbook-ch4-hidden-slides | db-book.com slides (ch4) | personal/course use | 61 (3 hidden) / 58 | hidden slides |
| 00-synthetic, 99-big-120 | generated with python-pptx | ours | 9 and 120 | every chart type, hidden slide, notes; 30 MB stress |

Gap: no public deck with an embedded video was found. The video line in the not-rendered list gets tested with a generated deck during the build.
