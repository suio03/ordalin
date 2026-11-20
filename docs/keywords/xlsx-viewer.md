# xlsx viewer

- Market / language: US + global, English (IN 4.4K, US 1.6K, PK 1.0K, ID 880, EG 590, TR 590 in Semrush)
- Started: 2026-11-19
- Mode: default stops
- Now: live 2026-11-19 (`650cdcc`). Verified on ordalin.com: page 200, canonical, sitemap, llms.txt, `pnpm seo:check` ok, a test .xlsx opens. Production build installed `xlsx` from the SheetJS tarball; the .xls/.xlsb/.ods path was not opened on the live site

## Steps

| # | Step | Status | Date | Output |
|---|---|---|---|---|
| 0 | Feasibility | done | 2026-11-19 | below |
| 1 | SERP research | done | 2026-11-19 | [serp-xlsx-viewer.md](../serp-xlsx-viewer.md) |
| 2a | AI-search questions | done | 2026-11-19 | [character-survey.md](../ai-search/2026-11-19-xlsx-viewer/character-survey.md) (Q1–Q4) |
| 2b | AI-search report | done | 2026-11-19 | [reference-audit.md](../ai-search/2026-11-19-xlsx-viewer/reference-audit.md) (4/4 samples, no browsing in any) |
| 3 | Feature requirements | done | 2026-11-19 | table below (R1–R22) |
| 4 | Feature build and model choice | done | 2026-11-19 | `src/lib/free-tools/xlsx-viewer/`, `src/components/free-tools/xlsx-viewer/`, route with placeholder copy; results in the Met? column |
| 5 | Structure and copy | done (owner: "可以的 下一步") | 2026-11-19 | `src/lib/free-tools/xlsx-viewer/page.en.ts`. Template changes: no examples wall or tips; added "Find", "What it does not show" (per-file list) and "When an XLSX won't open" (AI-search Q3). Rendered page: `xlsx` 1-gram #1, `xlsx viewer` 2-gram #2 behind `the xlsx`, `the xlsx viewer` 3-gram #1; `xlsx reader` 5 uses; copy about 1,500 words; no placeholders |
| 6 | Examples wall | skipped | 2026-11-19 | A viewer has no generated outputs to show |
| 7 | Page implementation and internal links | done | 2026-11-19 | Registry entry (hub, header menu on every page incl. the homepage, sitemap, llms.txt); pptx viewer closing links to it; page links to `/`, `/free-tools`, pptx viewer |
| 8 | Localization | English only for now | 2026-11-19 | My call: same as the pptx viewer; the non-US volume (IN, PK, ID, EG, TR) searches the English term. Open ja/es/id later if GSC shows local-language demand |
| 9 | Pre-launch SEO | done | 2026-11-19 | Subagent with `lyl-onpage-seo`: no blockers, no files changed; `pnpm seo:check` ok. Its unbacked-claim findings fixed in the copy (browser list, phone answer, "laptop"); print still untested |
| 10 | Launch report and commit | done | 2026-11-19 | Pushed to `main` on the owner's word |

Status: todo / in progress / waiting (user) / done / skipped (reason).

## Inputs from owner (2026-11-19)

- Semrush (US, desktop, 2026-11-19): `xlsx viewer` 1.6K US, 17.7K global, KD 38, CPC $0.78, informational. Variations (490, total 8.1K): xlsx document viewer 880 (KD 42), xlsx file viewer 720 (KD 38), excel viewer xlsx 320, view xlsx 320. Questions: how to view xlsx files 90.
- Google Ads Keyword Planner (all locations, English, Nov 2025 – Oct 2026): xlsx viewer / xlsx reader / xlxs reader / xlsx file viewer / xlsx opener / xlsx file reader / open online xlsx file / xlsx document viewer / xlsxviewer / xlxs file open online / xlxs file reader 10K–100K each; xlsx file opener, xlsx viewer online, free xlsx viewer 1K–10K. Competition low, flat trend.

## Feasibility (2026-11-19)

- No AI model, no server: parse and render in the browser (Web Worker), same shape as the pptx viewer. Shell (drop zone, size guard, not-shown list, export) can follow `src/components/free-tools/pptx-viewer/`.
- Candidate libraries on npm (to benchmark in step 4, not yet tested): SheetJS `xlsx` (Apache-2.0; reads xlsx/xlsm/xlsb/xls/ods/csv, values + formulas, weak on styles), `exceljs` 4.4.0 (MIT, styles; last release 2024), `@file-viewer/renderer-spreadsheet` 3.3.4 (Apache-2.0, same family as a pptx candidate), `@extend-ai/react-xlsx` 0.23.0 (MIT), `hucre` 1.3.0 (MIT), `@fortune-sheet/react` (MIT, editor-grade, heavy), `@univerjs/presets` (Apache-2.0, heavy).
- Risks: fidelity (charts, images, conditional formatting, pivot layouts), very large sheets (needs a virtualized grid), formulas are shown from saved results (no recalculation).
- Legacy `.xls` looks reachable client-side through SheetJS, unlike `.ppt`.

## Decisions

- 2026-11-19: step 1 decisions, owner: "好的，开始": one page `/free-tools/xlsx-viewer` in "Documents and slides"; target `xlsx viewer` + `online xlsx viewer`, twin `xlsx reader`; excluded: app downloads, editing, converters, password removal, `excel viewer` / `xls viewer`; v1 direction: local render, sheet tabs, styles/merged/number formats/frozen panes, formula bar, find across sheets, hidden sheets/rows/columns, images (charts if the renderer allows), CSV export + print to PDF, not-shown list, .xlsx/.xlsm/.xlsb/.csv/.ods and .xls if verified; no sign-up or daily cap.

- 2026-11-19: step 2a, owner: "好的。": AI-search questions Q1–Q4 confirmed as proposed.

- 2026-11-19: step 2b, owner: "下一步": report accepted, move to feature requirements.

- 2026-11-19: step 3, owner: "继续": R1–R22 accepted as proposed (charts and comments later).

## Feature requirements

Merged 2026-11-19 from the SERP feature list and the AI-search report. Test set for the checks: one self-built workbook T1 (5 sheets: styles + merged cells + number formats, formulas, frozen panes + hidden rows/columns + one hidden sheet, images + one chart, conditional formatting + comments), plus T2 large (100,000 rows × 20 columns), T3 password-protected, T4 truncated (corrupt), T5 a `.docx` renamed to `.xlsx`, and T1 saved as `.xlsm`, `.xlsb`, `.xls`, `.ods`, `.csv`.

| # | Requirement | Source | Must / later | Acceptance check | Met? |
|---|---|---|---|---|---|
| R1 | Parse and render in the browser; the file is never uploaded | SERP (ReoGrid, ExcelTool), AI P5/P13 | Must | Opening T1 sends no network request carrying file bytes (DevTools network log); after the page has loaded, T1 opens with the network offline |Yes: opening files made no network request except the worker script |
| R2 | No sign-up, no daily cap, free | AI P1/P11, SERP (Jumpshare, Aspose) | Must | Tool usable signed out; 10 files in a row open without any gate |Yes: no gate in the tool |
| R3 | Read-only; macros never run; original untouched | AI P14, SERP (ExcelTool) | Must | No editable cell; `.xlsm` opens with a "macros not run" note |Yes: no editable cell; .xlsm shows the macros note |
| R4 | Sheet tabs incl. hidden sheets (marked, viewable) | SERP, owner direction | Must | T1 shows 5 tabs, the hidden one labelled hidden |Yes: 6 tabs, hidden one labelled |
| R5 | Cell fidelity: fonts, fills, borders, alignment, merged cells, number/date formats, column widths, row heights | SERP (ReoGrid), AI P4/P12 | Must | T1 sheet 1 matches an Excel screenshot cell for cell on text, merge ranges and formatted values; colours and borders visibly the same |Yes on T1 (fonts, fills, borders, alignment, merges, number/date formats, sizes); rich text, rotation, gradients listed as not shown |
| R6 | Frozen panes; hidden rows/columns marked and expandable | SERP (ExcelTool) | Must | T1 sheet 3: header stays while scrolling; hidden rows/columns shown as markers that can be revealed |Yes: frozen row/column stay; double rule marks hidden rows/columns, toggle shows them |
| R7 | Formula bar: selected cell shows formula text and saved result (no recalculation) | SERP gap (not ReoGrid/ExcelTool) | Must | T1 sheet 2: every formula cell shows its formula and the saved value |Yes: formula text plus saved result |
| R8 | Find across all sheets | SERP (ExcelTool: in sheet only) | Must | A value present on sheets 1 and 4 returns both hits and jumps to each |Yes: 3 hits on 3 sheets incl. the hidden sheet and a hidden column |
| R9 | Workbook overview on open: sheets, used range per sheet, hidden items, counts of formulas/images/charts | AI (S4) | Must | Overview numbers for T1 equal the known contents |Yes |
| R10 | File diagnosis: real format from file header; distinct messages for encrypted, corrupt, wrong type, empty | AI P7/P15 (S3) | Must | T3, T4, T5 and a 0-byte file each get their own message with a next step; no password removal |Yes: empty, damaged, Word file, password, wrong password, unknown type each get their own message |
| R11 | Large sheets: virtualized grid, parsing in a Worker, stated tested limit | SERP (50 MB / 20 MB caps), AI P16 | Must | T2 opens without freezing the tab (UI responds during parse; scrolling stays smooth); the tested size is recorded as the page's limit |Yes: see facts; sheets taller than 8M px use a squeezed scrollbar |
| R12 | "Not shown" list per file | SERP (competitors only state it in copy), AI P12 | Must | Each T1 feature we don't render appears in the list; nothing rendered is listed |Yes: charts and conditional formatting listed for T1 |
| R13 | Formats: `.xlsx`, `.xlsm`, `.csv` | SERP, AI (S3) | Must | The three variants of T1 open with the same values |Yes |
| R14 | Formats: `.xls`, `.xlsb`, `.ods` | SERP (onlinedocumentviewer) | Must if the library passes, else later | Each variant opens with the same values as T1; whichever fails is listed as unsupported, not half-shown |Yes, basic view (no fonts, colours, borders, pictures) |
| R15 | Images in cells/over the grid | SERP gap, owner direction | Must if the library exposes them, else in the "not shown" list | T1 sheet 4 images appear at the right anchor |Yes for .xlsx/.xlsm: 2 pictures at their anchors |
| R16 | Charts | SERP gap (only Aspose, server-side) | Later (evaluate in step 4) | Decide from the benchmark; until then listed as not shown |Not drawn: placeholder box with the chart title, listed as not shown |
| R17 | Export current sheet as CSV; print / save as PDF | SERP (ExcelTool, Canva, GroupDocs) | Must (CSV), print via browser print stylesheet | CSV of T1 sheet 1 re-opens with the same values; print preview shows the grid without page chrome |CSV yes (shown text, UTF-8 BOM). Print code path unit-tested; the browser print dialog was not exercised |
| R18 | Cell comments / notes shown | owner direction (SERP "win" list) | Later unless free with the library | T1 sheet 5 comments visible on hover or in a panel |Yes: red corner marker, note text in the formula bar and tooltip |
| R19 | Conditional formatting | AI A3 (idea) | Later | Listed as not shown until done |Not applied: listed as not shown |
| R20 | Mobile layout: horizontal scroll, tab strip, drop zone → file picker | AI P6 | Must | T1 usable at 390 px width |Yes at 390 px: no page overflow, targets 44 px; about 2 columns visible at a time |
| R21 | Paste a file from the clipboard | SERP (ExcelTool) | Later | — |Not built |
| R22 | Password-protected files opened with the password | SERP (GroupDocs) | Later (not planned) | Until then R10 message |Yes for .xlsx (hucre decrypts in the browser); encrypted .xls gets a message |

Content actions (step 5): hero answers "no Excel, no sign-up, no upload"; privacy section with a way to verify it; rendered / not rendered table from the T1 results; FAQ in the words of Q1–Q4; device FAQ. Channel actions: none this round. Later guides: see open items.

## Verified product facts

Only facts verified in code, config or tests; page claims come from here.

| Fact | Value | Verified by |
|---|---|---|
| Libraries | hucre 1.3.0 for .xlsx/.xlsm (styles, pictures, comments, decryption); SheetJS 0.20.3 loaded on demand for .xls/.xlsb/.ods; CSV parsed in-house | `package.json`, `open.ts` |
| No upload | Files are read in a Web Worker in the browser; no request carries file data | network log while opening T1–T7, 2026-11-19 |
| Offline | Not claimed: the reader code loads on first open, so the page needs a connection until then | code |
| Formats | .xlsx, .xlsm (full view); .xls, .xlsb, .ods (basic view: values, number formats, formulas, merges, sizes); .csv/.tsv (all fields as text) | fixtures T1.* |
| File size cap | 100 MB (`MAX_FILE_BYTES`) | `xlsx-viewer-tool.tsx` |
| Tested size | 1,048,576 rows × 10 columns (10.5M cells, 74 MB .xlsx) opened in 4–6 s; 6M cells in 2.5 s; 2M cells in 0.9 s; desktop Chrome on a Mac, about 0.9 GB memory for the largest. Phones not measured | T2, T6, T7, 2026-11-19 |
| Find | All sheets incl. hidden ones, matches the displayed text, first 2,000 hits; last row of 10.5M cells found in 2.8 s | `find.ts`, T6 |
| Formulas | Shown as text with the result saved in the file; never recalculated | `display.ts` |
| Macros | Never run; .xlsm shows a note | `detect.ts`, T1.xlsm |
| Passwords | Password-protected .xlsx opens with the password, decrypted in the browser; protected .xls does not open | T3 |
| Hidden items | Hidden sheets open from their tab (labelled); hidden rows/columns marked, shown with one toggle | T1 |
| Not drawn | Charts (placeholder), conditional formatting, sparklines, shapes/text boxes, slicers, mixed formatting inside a cell, rotated text, gradient fills, embedded objects | `convert.ts` issue log |
| Export | Current sheet to CSV (text as shown); print sends up to 5,000 rows | `export.ts` |
| Also shown | Frozen panes; notes (red corner, text on select) and links; pictures at their anchors; overview counts of formulas, pictures, charts, notes, merged ranges and hidden items; file type taken from content, not extension; uninstalled fonts replaced; CSV in UTF-8 | T1, `copy.ts`, `detect.ts`, `export.ts` |
| Browsers / devices | Tested in Chrome on a Mac only; phone = 390 px layout check, no real device. The page does not name other browsers | 2026-11-19 |
| Price / account | Free, no sign-up, no daily cap, no watermark | no gate in the code |

## Open items

- Print: the print frame's content was checked in Chrome (table complete); the OS print dialog itself was not opened. The first production build has to show that Workers Builds installs `xlsx` from the SheetJS CDN tarball.
- Possible later: zoom control for phones, paste from clipboard (R21), charts (R16), conditional formatting (R19).

- Later guide ideas from the report (not this page): spreadsheet attachment won't open; can ChatGPT open an xlsx file
