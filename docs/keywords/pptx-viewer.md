# pptx viewer

- Market / language: US + global, English (IN 2.4K, PH 1.0K, TR 880, PK 720 in Semrush)
- Started: 2026-11-15
- Mode: default stops
- Now: step 10 launch report sent, waiting on owner to say ship (commit + push = production deploy)

## Steps

| # | Step | Status | Date | Output |
|---|---|---|---|---|
| 0 | Feasibility | done | 2026-11-15 | below |
| 1 | SERP research | done | 2026-11-15 | [serp-pptx-viewer.md](../serp-pptx-viewer.md) |
| 2a | AI-search questions | done | 2026-11-15 | [character-survey.md](../ai-search/2026-11-15-pptx-viewer/character-survey.md) (Q1–Q4) |
| 2b | AI-search report | done | 2026-11-16 | [reference-audit.md](../ai-search/2026-11-15-pptx-viewer/reference-audit.md) |
| 3 | Feature requirements | done | 2026-11-16 | below |
| 4 | Feature build and model choice | done | 2026-11-16 | benchmark: [pptx-viewer-bench.md](pptx-viewer-bench.md); code: `src/components/free-tools/pptx-viewer/`, `src/lib/free-tools/pptx-viewer/`, test page `/free-tools/pptx-viewer` (noindex) |
| 5 | Structure and copy | done | 2026-11-16 | `src/lib/free-tools/pptx-viewer/page.en.ts` (rendered on the noindex test page) |
| 6 | Examples wall | skipped | 2026-11-16 | the tool is the demo; no before/after images |
| 7 | Page implementation and internal links | done | 2026-11-16 | registry (new group "Documents and slides"), hub copy, header menu/footer/sitemap/llms.txt via registry; noindex removed; JSON-LD BusinessApplication |
| 8 | Localization | skipped for now | 2026-11-16 | English only: Semrush top markets IN/PH/PK use English; TR alone doesn't justify a locale yet (free-tools i18n opens per tool on demand) |
| 9 | Pre-launch SEO | done | 2026-11-16 | subagent (lyl-onpage-seo): all checks pass; fixed one FAQ sentence and thumbnail aria-labels ("Go to slide N (Hidden)") |
| 10 | Launch report and commit | waiting on owner | 2026-11-16 | `next build` passes |

## Inputs from owner (2026-11-15)

- Semrush (US, desktop, 2026-11-14): `pptx viewer` 1.3K US, 15.6K global, KD 23, CPC $0.65, informational. Variations: online pptx viewer 210, .pptx viewer 170, online .pptx viewer 140, pptx viewer online 140.
- Google Ads Keyword Planner (all locations, English, Nov 2025 – Oct 2026): pptx viewer / pptx reader / online pptx viewer 10K–100K each; pptx file opener, online pptx opener, online pptx reader, opening pptx, pptx open online 1K–10K; pptx opener and pptxviewer 1K–10K at +900% three-month change; pptx viewer download, android pptx viewer, app to open pptx 100–1K.

## Feasibility (2026-11-15)

- No AI model, no server: parse and render the .pptx in the browser (Web Worker), same privacy shape as the ai-metadata tool. Workers/R2 not needed.
- Candidate MIT/Apache renderers, all maintained in 2026: `@aiden0z/pptx-renderer` (Apache-2.0, TS), `pptx-glimpse` (MIT, SVG/PNG out), `@diceui/pptx-core` (Apache-2.0), `pptx-viewer` (MIT, small), `@file-viewer/renderer-pptx` (Apache-2.0, also pptm/ppsx/potx). Excluded: `@kandiforge/pptx-renderer` (UNLICENSED), legacy jQuery PPTXjs.
- Risk: fidelity (SmartArt, charts, embedded fonts, animations, video). Step 4 must benchmark 2–3 libraries on a fixed set of real decks.
- `.ppt` (old binary) is out of reach client-side; page must say so honestly.
- SERP (quick look): SlideModel, Notevibes (both in-browser, no upload), Canva, Aspose, GroupDocs, Zamzar, WPS, tiiny.host. Mostly big file-tool sites with tool landing pages, not years-old single-purpose incumbents.

## Decisions

- 2026-11-15: owner: "要做。"
- 2026-11-15: step 1 decisions, owner: "好的，开始": one page `/free-tools/pptx-viewer`; target `pptx viewer` + `online pptx viewer`, twin `pptx reader`; v1 must-haves: local render, thumbnails, fullscreen slideshow with PowerPoint keys, speaker notes, not-rendered list, PNG/PDF export, .pptx/.ppsx/.potx/.pptm; later: presenter timer, fallback fonts, AI narration.
- 2026-11-15: step 2a questions Q1–Q4, owner: "可以"
- 2026-11-16: step 2b report, owner: "好的"
- 2026-11-16: step 3 requirements, owner: "好的。开始" (also started step 4)
- 2026-11-16: step 4 renderer `@aiden0z/pptx-renderer`, owner: "好的。开始"
- 2026-11-16: step 5 copy, owner: "确定。" (examples wall skipped as recommended)
- 2026-11-16: step 4 accepted, fullscreen works, owner: "我试了，可以的。 下一步吧"
- 2026-11-16: new design token `presentationGround` #000 (both themes) for the slideshow backdrop

## Feature requirements

| Requirement | Source | Must / later | Acceptance check | Met? |
|---|---|---|---|---|
| Local parse + render in the browser; nothing uploaded; works offline once the page has loaded | SERP (SlideModel, Notevibes), ChatGPT S2 privacy note, Aspose check | must | DevTools: no request carries file bytes; set network offline after load, open a second deck, it renders || yes (network: only code chunks + blob URLs); offline not tested |
| Open .pptx, .ppsx, .potx, .pptm (macros never run) | SERP, owner | must | one test file per format opens; .pptm macros ignored || yes (+ppsm/potm by detection); pptm shows macros note |
| Clear message for .ppt / .odp / .key / password-protected / corrupt files, with other ways to open | SERP (.ppt demand), Notevibes | must | each case shows a specific message, no blank screen or freeze || yes (unit tests + detect) |
| Render fidelity good enough to read every slide | SERP, ChatGPT S1/S4 ("as close to the original") | must | test set (below): text inside its boxes, images/tables/shapes/grouped shapes present, theme colours and backgrounds right, slide size right; checked against the author's PDF || yes, with known limits below |
| "Not rendered" list per deck and per slide (video, audio, SmartArt fallback, OLE/embedded objects, animations, missing fonts → substitute) | SERP (SlideModel pre-show note), ChatGPT gap (4/4 never said what looks different) | must | test deck with a video, an embedded object and a non-system font lists all three on the right slides || yes (deck 10: mp4 plays, wmv/OLE listed) |
| Thumbnail rail, prev/next, slide counter, zoom / fit | SERP | must | 100-slide deck: thumbnails load lazily, scrolling and jumping stay smooth on a mid laptop || yes (120 slides smooth) |
| Fullscreen slideshow with PowerPoint keys: → ← Space Enter PgUp PgDn, Home End, number + Enter, B / W blank, Esc | SERP (SlideModel), ChatGPT S3 ("watch the slideshow") | must | each key does what it does in PowerPoint || yes (keys verified; fullscreen confirmed by owner 2026-11-16) |
| Speaker notes panel | SERP (SlideModel) | must | notes text matches the deck for every slide that has notes || yes |
| Hidden slides marked (shown in viewer, skipped in slideshow) | SERP (SlideModel) | must | test deck hidden slide is badged and skipped in fullscreen || yes (deck 08) |
| Export: current slide PNG, all slides PNG as ZIP, whole deck PDF | SERP (`pptx to pdf/png` autocomplete, Canva, onlinedocumentviewer), ChatGPT S1 PDF fallback | must | PDF page count = slide count, slide aspect ratio kept; ZIP names `slide-01.png`…; 1920 px wide PNG || yes (1920 px PNG, ZIP, PDF page = slide) |
| No sign-up, no daily cap, no slide truncation | ChatGPT S2 (no-sign-in pick), Aspose (2 MB / 10 slides guest), SlideModel (15/day, 5 MB) | must | 100-slide deck shows all slides; 20 opens in a row work || yes |
| Size guard from real limits, clear message beyond | SERP (competitor limits), ChatGPT gap (size never mentioned) | must | measure largest deck that opens on desktop Chrome and on a phone; page states that number; beyond it a message, no tab crash || desktop yes (300 MB); phone not measured |
| Phone browser viewing: tap/swipe navigation, thumbnails collapse | ChatGPT S4, SERP (any device FAQ) | must | full flow at 390 px; iOS Safari + Android Chrome checked once || layout yes at narrow width; real iOS/Android not checked |
| Drag-and-drop + file picker | template of other free tools | must | both load a deck || yes |
| Search across slide text | SERP (our win list) | later | — | |
| Clickable links inside slides | SERP (SlideModel) | later | — | |
| Presenter view with timer | SERP (SlideModel) | later | — | |
| Metric-compatible fallback fonts (Calibri, Cambria, Segoe…) | SERP (SlideModel) | later (cost: font licences / bundle size) | — | |
| Keyboard and screen-reader access beyond slideshow keys | ChatGPT P20 (no sample support) | later | — | |
| AI narration / audio | Notevibes | later (paid model, needs approval) | — | |

### Fidelity test set (step 4)

No PowerPoint, Keynote or LibreOffice on this machine, so the reference is the author's own PDF: 6–8 public decks published as both .pptx and PDF (government, university or CC-licensed sources), chosen to cover text-heavy, theme/master layouts, tables, native charts, SmartArt, pictures with crops, grouped shapes, a video, custom fonts, notes, a hidden slide, 16:9 and 4:3. Kept out of Git (licences differ); list with source URLs goes in `docs/` notes. Shortlist to benchmark: `@aiden0z/pptx-renderer`, `pptx-glimpse`, `@file-viewer/renderer-pptx` (licence, bundle size, speed, fidelity scored per slide).

### Content actions (for step 5)

- First screen states: no sign-up, no daily limit, file never leaves the device (from ChatGPT gaps P13–P15, P22).
- FAQ in Q1–Q4's own words + SERP PAA; how-to "open a PPTX without PowerPoint" as a page section, not a separate page.
- "Other ways to open" section: PowerPoint for the web, Google Slides, Keynote, honest about sign-in/upload (ChatGPT recommends these 4/4).
- Honest limits section fed by the not-rendered list; old .ppt answer.

## Verified product facts

| Fact | Value | Verified by |
|---|---|---|
| Renderer | `@aiden0z/pptx-renderer` 1.4.0, Apache-2.0, ~405 KB gzip incl. echarts, loaded only when a file is opened | benchmark 2026-11-16, approved |
| Formats | .pptx .ppsx .potx .pptm (.ppsm .potm also open); macros never run; .ppt/.odp/.key/encrypted get a specific message | build 2026-11-16 |
| Upload | none; file read in the browser, network shows no file bytes | build 2026-11-16 |
| Size limit | 300 MB; 288 MiB deck opens in ~0.5 s (~800 MB JS heap), 318 MiB gets the limit message | build 2026-11-16, desktop Chrome |
| Big deck | 28 MB / 120 slides opens in 0.33 s | build 2026-11-16 |
| Export | slide PNG 1920 px wide; all slides PNG ZIP; whole-deck PDF, one page per slide at slide size | build 2026-11-16 |
| Media | web video/audio (mp4, mp3…) plays; wmv and other non-web media show the poster and are listed | build 2026-11-16 |
| Known limits | animations/transitions don't play; pattern fills render lighter; EMF/WMF previews of embedded objects show a placeholder; missing fonts substituted (listed) | build 2026-11-16 |
| Speed | 120 slides / 30 MB rendered in <0.6 s on desktop Chrome | benchmark 2026-11-16 |

## Copy notes (step 5, 2026-11-16)

- Structure: skeleton minus Examples (comes from the tool itself; step 6 decides if a sample deck is needed) and Use cases (folded into "Good for"); added "Present full screen" (key table, SERP must-have), "Save as PNG/PDF" (`pptx to pdf/png` autocomplete) and "Why some slides may look different" (AI-search gap 4/4). "Other ways to open" is the category comparison (PowerPoint, Google Slides, Keynote, LibreOffice: ChatGPT's own picks), no named viewer competitors.
- Measured on main content: 1369 words; `pptx` #1, `pptx viewer` #1 2-gram, `online pptx viewer` #1 3-gram, `viewer` #6 1-gram (behind slide/slides/file/powerpoint, topical, no noise words); twin `pptx reader` 4 incl. title; `pptx opener`, `open PPTX online`, `pptx file viewer` once each. No [fill] placeholders.
- Excluded: editing, app downloads (one FAQ "install anything?"), best-of lists.
- Verify before launch (claims on the page): Firefox + Safari open a deck; iPhone + Android open and swipe; exports carry no watermark (true by code).
- Links in (step 7): free-tools hub card, homepage body, footer auto-list. No same-intent siblings yet.

## Open items

- Before launch: check once on a real iPhone + Android; measure phone size limit
- Channel: after launch, re-ask ChatGPT Q1–Q4 (temporary chat, with and without search) to see if the tool is recommended; baseline 2026-11-16 = not recommended, no browsing
