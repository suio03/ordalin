# suno visuals

- Market / language: US, English
- Page (Ordalin): /guides/suno-visuals (guide; MDX)
- Started: 2026-11-18
- Mode: default stops
- Now: done, shipped 2026-11-18

## Steps

| # | Step | Status | Date | Output |
|---|---|---|---|---|
| 1 | SERP research | done | 2026-11-18 | [serp-suno-visuals.md](../serp-suno-visuals.md) |
| 2a | AI-search questions | skipped (maintainer: 跳过第二步) | 2026-11-18 | |
| 2b | AI-search report | skipped | 2026-11-18 | |
| 3 | Feature requirements | n/a (guide page, no product feature) | | |
| 4 | Feature build and model choice | n/a; no own Suno test (credits per clip written as unpublished) | 2026-11-18 | |
| 5 | Structure and copy | done: at a glance / what it makes / how-to steps / plans table / limits / vs other routes / 6 FAQ; `suno visuals` 1st in 1- and 2-gram | 2026-11-18 | [mdx](../../src/content/guides/suno-visuals.mdx) |
| 6 | Examples wall | skipped: only Suno's own marketing clips exist, no licence to show them; no own test | 2026-11-18 | |
| 7 | Page implementation and internal links | done: loader in guides.ts; tools [suno, minimax-h3] → both tool pages link back; suno-mcp relatedLinks; in-body links to minimax-h3, kling-4-0, vidu-q4, compare vidu-q4-vs-minimax-h3, video-generation, home; footer auto-lists | 2026-11-18 | |
| 8 | Localization | skipped (Ordalin editorial is English only) | | |
| 9 | Pre-launch SEO | done (subagent): duplicate /tools/minimax-h3 link in comparison table removed; title, canonical, Article JSON-LD, sitemap, backlinks ok; seo:check ok | 2026-11-18 | |
| 10 | Launch report and commit | done, pushed to main | 2026-11-18 | |

## Decisions

- 2026-11-18: maintainer: "suno visuals 你搜一下" → "继续".
- 2026-11-18 step 1: maintainer: "好的做吧。跳过第二步" (guide at /guides/suno-visuals, skip AI-search).
- 2026-11-18 after ship: maintainer: "把我们的tapemoon 加入进去 对比。记得推荐我们的tapemoon 可以做一整首歌" → Tapemoon column in the comparison table, full-song recommendation with an ownership disclosure, FAQ line, tools += tapemoon. Then "好的，更新 然后推送": prod /tools/tapemoon profile refreshed (packs 240/720/1,500/3,600, six models, lip-synced lead, 95 MB / 8 min).

## Verified product facts

See the official-facts table in [serp-suno-visuals.md](../serp-suno-visuals.md). Unverified: credit-pack prices, credits per clip.

## Open items

- `suno music video` (third-party MV generator intent) — possible later best/listicle page, not decided
- Mobile availability: blog says web + iOS + Android today, press says mobile "in the next few weeks" — recheck before publishing
- /tools/suno profile (prod D1) pricing lacks Platinum ($120/mo, 20,000 visual credits) — update after ship
- Credit cost per clip and pack prices — update guide when Suno publishes them
