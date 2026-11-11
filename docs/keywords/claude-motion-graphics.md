# claude motion graphics

- Market / language: US, English
- Page (Ordalin): /guides/claude-motion-graphics (guide + demos wall, revid-style, lemo-opuscar gallery pattern)
- Started: 2026-11-12
- Mode: default stops
- Now: done, shipped 2026-11-12

## Steps

| # | Step | Status | Date | Output |
|---|---|---|---|---|
| 1 | SERP research | done | 2026-11-12 | [serp-claude-motion-graphics.md](../serp-claude-motion-graphics.md) |
| 2a | AI-search questions | skipped (maintainer chose revid-style guide + demos directly) | 2026-11-12 | |
| 2b | AI-search report | skipped | 2026-11-12 | |
| 3 | Feature requirements | n/a (guide page, no product feature) | | |
| 4 | Feature build | n/a; own test runs not requested (cites Cinetic Fable 5.2 vs Opus 5.5 test) | 2026-11-12 | |
| 5 | Structure and copy | done (3 routes: Claude Motion / Claude Code + skill / After Effects; PAA FAQ) | 2026-11-12 | [mdx](../../src/content/guides/claude-motion-graphics.mdx) |
| 6 | Examples wall | done: 49 open-source demos (MIT/Apache-2.0), hotlinked, local posters | 2026-11-12 | [demos.ts](../../src/content/guides/claude-motion-graphics-demos.ts) |
| 7 | Page implementation and internal links | done: guide `gallery` export + FilmGallery `source` line; links to cinetic, lemo-opuscar, stickman, rea-video, reanimate, code-animation-prompts; footer auto-lists guides | 2026-11-12 | /guides/claude-motion-graphics |
| 8 | Localization | skipped (Ordalin is English only) | | |
| 9 | Pre-launch SEO | done (subagent): description 189→163 chars; gallery alt text fixed; in-body links from /skills/cinetic and /skills/lemo-opuscar; title kept (59 + suffix) | 2026-11-12 | |
| 10 | Launch report and commit | done, pushed to main | 2026-11-12 | |

## Decisions

- 2026-11-12: maintainer: "claude motion graphics。我要做这个关键字。你去调研一下。"
- 2026-11-12: maintainer: "我希望是https://www.revid.ai/claude-motion-graphics 按照他们这样做。也就是跟我们的lemon skills差不多。首先是guide 然后是一些 demos。我会去找一些开源的 或者你去找开源的。"

## Demo sources (open source, 2026-11-12 inventory)

Scratch inventory: demos-inventory.txt in session scratchpad. Candidates: whaleyxbt/claude-motion (MIT, 4 GIF + X posts), Barty-Bart/motion-graphics (MIT, 7 GIF), charlie947/motion-graphics-skills (MIT, 2 GIF), Tejashmakwana/motionmaxxing (Apache, 4 MP4 before/after), latent-spaces/brag (MIT, 5 MP4 + Pages), langchain-ai/design-agent (Apache, MP4), nateherkai/herk-edit-kit (other, ~10 MP4), heygen-com/hyperframes-launches (Apache, 20 projects, finals mostly not in repo), zhuyansen/awesome-claude-video-skills (CC0 list, 297 previews; each project own licence), plus Ordalin's lemo-opuscar/cinetic/stickman/rea-video.

- 2026-11-12: maintainer approved ("可以"): 40+ licensed demos, three-route guide, density measured first (awesomeclaude exact phrase 6×/3,482 words; revid 0×/2,404).
- Excluded demos: pixel2motion (Codex only), motionmaxxing Cluely (GPT-6.1), digitalsamba handoff (AI video clips), vvv (non-commercial music), duplicates.

## Open items

- `claude motion` (official product name, ~10× volume, official SERP) — separate page, not decided
- Own test runs (model, count) — only if maintainer asks
