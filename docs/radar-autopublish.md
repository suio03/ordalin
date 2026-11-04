# Radar auto-publish

Status: active twice daily (10:30 and 18:30 Melbourne) on the maintainer's Mac, approved 2026-11-02.

A private keyword monitor (keyword-radar) pushes new names people have started searching.
Twice a day a headless Claude Code run takes everything it pushed since the previous run and, for each name that fits Ordalin, imports the
tool and/or publishes a guide **directly, without maintainer review**. This is the one approved
exception to "guides start as drafts"; the maintainer reads the Telegram summary afterwards.

## Pieces

- `scripts/radar-autopublish/run.sh`: the job. Fetches candidates, runs `claude -p` with the
  prompt below, sends the final message to Telegram through keyword-radar, and moves the
  start time forward only when the run finished. A failed run is retried by the next one.
- `scripts/radar-autopublish/candidates.ts`: `GET <radar>/ordalin/candidates?since=` plus what
  Ordalin already has for each name (tools by name, guide slugs). Looks back at most 3 days.
- `.env.radar` (ignored): `RADAR_URL` (the keyword-radar Worker URL) and `RADAR_TOKEN`
  (its `INGEST_TOKEN`). Neither belongs in Git.
- `scripts/radar-autopublish/com.ordalin.radar-autopublish.plist`: launchd schedule. Install:
  `sed "s|__ROOT__|$PWD|g" scripts/radar-autopublish/com.ordalin.radar-autopublish.plist > ~/Library/LaunchAgents/com.ordalin.radar-autopublish.plist && launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.ordalin.radar-autopublish.plist`.
  Dry run (decisions only, printed): `DRY_RUN=1 scripts/radar-autopublish/run.sh`.
  Run now: `launchctl kickstart gui/$(id -u)/com.ordalin.radar-autopublish`. Stop: `launchctl bootout gui/$(id -u)/com.ordalin.radar-autopublish`.
- Logs and summaries: `.ordalin-imports/radar-auto/<YYYY-MM-DD-HHMM>/`.

Limits: at most 10 tool candidates and 2 guides per run; the import gate and the 20-per-day
publication cap in `docs/catalog-import-automation.md` still apply. Guides reach production
through the normal push-to-main Workers Build.

## Prompt

<!-- prompt -->
You are running Ordalin's unattended radar auto-publish batch. Nobody will answer questions:
decide, act within the rules, and finish with the summary. Do not ask for confirmation.

1. Read AGENTS.md, docs/radar-autopublish.md, docs/catalog-profile-standard.md,
   docs/catalog-import-automation.md and docs/guides.md, and read
   src/content/guides/clean-your-tv.mdx as the reference for a published guide.
2. Read the candidates file named at the end of this prompt. Each item has `lane`
   (webcafe, upstream, github, meme), `name`, `query` (what people search), optional `url`,
   `note`, web.cafe `verdict`/`suggestion`/`brief`, and `ordalin` (tools and guides Ordalin
   already has for the name). Merge items that are the same product.
3. Decide per product: tool, guide, both, or skip. It fits Ordalin when it is a specific AI
   product, model, agent, skill or open-source AI project a person can use or install.
   Skip, with a short reason: news, research topics, health or general queries, people,
   games, TikTok trends that are not a specific tool, adult or gambling, big-company flagship
   chat models and their versions, non-AI products, and anything you cannot identify with
   confidence. `ordalin.tools` and `ordalin.guides` are name matches only: when one is the
   same product, skip the tool (already listed) or the guide (already written).
4. Official website: use the item's `url` when it is the product's own site; otherwise search
   the web. Accept a site only when its name and description clearly match the candidate.
   A product with only a GitHub repository gets no tool import (one domain per tool); it can
   still get a guide.
5. Tools (at most 10 per run): run
   `pnpm imports:prepare -- --remote --urls=<comma-separated official URLs>`
   then, for each prepared bundle in the printed directory, fill `analysis` exactly as
   steps 3-6 of the prompt in docs/catalog-import-automation.md and the researched-profile
   standard require, run `pnpm imports:screenshots -- --manifest=<manifest>`, inspect the
   images, and apply each bundle with
   `pnpm imports:apply -- --remote --manifest=<manifest> --publish-limit=20 --daily-publish-limit=20 <bundle>`.
   Let the apply command publish or skip; never override it.
6. Guides (at most 2 per run, highest search intent first): only where people search how to
   use, install, download or judge the product (a web.cafe suggestion or brief asking for a
   tutorial or content page, or completions like "github", "download", "how to use") and the
   official sources give enough facts for a useful page. Write
   `src/content/guides/<slug>.mdx` following docs/guides.md and the clean-your-tv guide:
   every fact from official sources, linked, with the check date; say plainly that Ordalin
   has not tested it hands-on and credit any hands-on reports you cite; no invented features,
   prices, numbers or opinions. Set `status: "published"` and `publishedAt`/`updatedAt` to
   today's Melbourne date; list the catalogue slug in `tools` when the tool is published.
   Register the loader in `src/lib/guides.ts`. Run `pnpm typecheck` and `pnpm test`; fix the
   guide or drop it if they fail. Then commit only those files
   (`git add src/content/guides/<slug>.mdx src/lib/guides.ts`, message
   `feat(guides): publish <Name> guide`), `git pull --rebase --autostash`, `git push`.
7. Do not change any other code, documentation, migrations, taxonomy or existing tools, and
   do not deploy by hand. Continue past individual failures.
8. Your final message is sent to the maintainer on Telegram as plain text. Write it in
   Simplified Chinese, product names in English, and nothing else:
   上线工具 N：<name> https://ordalin.com/tools/<slug>（one per line）
   发布指南 N：<title> https://ordalin.com/guides/<slug>
   跳过 N：<name>（<reason>）, grouped by reason when many
   需要处理：exact errors or items needing the maintainer, or 无
<!-- /prompt -->
