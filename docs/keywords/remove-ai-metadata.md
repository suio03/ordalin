# remove ai metadata

- Market / language: US, English
- Pages (Ordalin): /free-tools/ai-metadata-remover (`ai metadata remover`, `remove ai metadata`) and /free-tools/ai-label-remover (`remove ai label`, `ai label remover`, `ai tag remover`)
- Started: 2026-11-11
- Mode: default stops
- Now: live 2026-11-11

## Steps

| # | Step | Status | Date | Output |
|---|---|---|---|---|
| 1 | SERP research | done | 2026-11-11 | [serp-remove-ai-metadata.md](../serp-remove-ai-metadata.md) |
| 2a | AI-search questions | skipped (reuse ailabelremover 2026-11-02 report, same task) | | |
| 2b | AI-search report | skipped (same) | | |
| 3 | Feature requirements | done (port of ailabelremover R1–R12) | 2026-11-11 | below |
| 4 | Feature build | done | 2026-11-11 | `src/lib/free-tools/ai-metadata/`, `src/components/free-tools/ai-metadata-remover.tsx` |
| 5 | Structure and copy | done (requested work ships, no draft stop) | 2026-11-11 | the two page.tsx files |
| 6 | Examples wall | skipped (ailabelremover keeps its wall; Ordalin pages use a scan-results list from verified real files instead) | | |
| 7 | Page implementation and internal links | done: footer, sitemap, llms.txt, OG checker page, the two pages link each other and /skills/watermarks-remover | 2026-11-11 | |
| 8 | Localization | skipped (Ordalin is English only) | | |
| 9 | Pre-launch SEO | done (subagent: label title/description now lead with `remove ai label` + `ai tag remover`; category + home links added; seo:check ok) | 2026-11-11 | |
| 10 | Launch report and commit | done (pushed to main) | 2026-11-11 | |

## Decisions

- 2026-11-11: owner wants the tool on Ordalin as well as ailabelremover.tools, the two competing: "两个站可能应该都做，因为你不知道 Google 那里会给哪一个站，并且你不去自己竞争，外面还是会有人来跟你一起竞争。" Then: "开始。" ailabelremover stays live with no redirect.
- 2026-11-11 step 1: owner: "remove ai metadata 和 label 都要做，这都是不同的需求", with a keyword table (likely removeailabel.com organic, Similarweb): remove ai label 11.49K vol, ai metadata remover 12.41K, ai label remover 6.05K, ai remover 21.34K, ai tag remover 2.4K. Two Ordalin pages; `ai remover` excluded (mixed intent: object/watermark removal). Note: Trends gave `ai metadata remover` ≈1 vs `remove ai label` 46; the owner's table wins.

## Feature requirements

Port of ailabelremover R1–R12 (scan, verdict, clean, AI-only mode, lossless, 5 formats, re-scan, batch + ZIP, browser-only, limits, honest limits, no fake EXIF). Its tests come along.

| Requirement | Source | Must / later | Acceptance check | Met? |
|---|---|---|---|---|

## Verified product facts

| Fact | Value | Verified by |
|---|---|---|
| Formats | JPG, PNG, WebP, HEIC, AVIF in; same format out | `meta.test.ts` (26 tests, vitest) |
| Lossless | image data byte-identical after cleaning; the worker compares it and shows the result | `worker.ts`, local browser test 2026-11-11 |
| Modes | all: keeps Orientation + ICC; ai-only: C2PA always dropped, other blocks only when they hold AI, EXIF AI tags blanked | tests; browser test (ai.jpg kept camera/date in ai-only) |
| Limits | 30 files, 50 MB each | `src/lib/free-tools/ai-metadata/limits.ts` |
| Processing | Web Worker in the browser; 0 network requests during upload and cleaning | Chrome network log, localhost, 2026-11-11 |
| Analytics | event `AI Metadata Download` (props page, format, verdict, signals = AI block kinds, mode, count); no names, sizes, contents | component; registered in Plausible 2026-11-11 |
| Generator results | OpenAI gpt-image, Google nano-banana (incl. SynthID note), ByteDance Seedream C2PA | ailabelremover verified facts, real files 2026-11-02 |

## Open items

- ~~Register Plausible events~~ done 2026-11-11
- Later: C2PA / "remove content credentials" section; /skills/watermarks-remover backlink to these tools — me
