# Ordalin project instructions

## Project identity

- The repository name is `ordalin`.
- The product and brand name is **Ordalin**.
- Treat Ordalin as the final selected name, not a working title or naming candidate.

## Sources of truth

- Follow `MVP_PLAN.md` for approved product scope, routes, data, ranking, and operational constraints.
- Follow `docs/design-system.md` for the approved **Quiet Radar** product design language.
- Use `docs/tokens.json` as the platform-neutral token source and `docs/design-tokens.css` as the web adapter.
- Follow `brand/BRAND_GUIDELINES.md` for the approved **Editorial Cut** logo; do not redraw or retype it.

## Implementation boundaries

- Support System, Light, and Dark appearance modes. System is the default; preserve the user's explicit choice and prevent a wrong-theme first paint.
- Keep the homepage search-first but not search-only; useful inventory must be visible without entering a query. The homepage is a category sidebar beside a column of shelves; the full catalogue lives at `/tools`.
- Use semantic tokens instead of introducing visual one-off values.
- Build hierarchy with three surface steps (page ground, raised cards and panels with `shadowCard`, quiet fills inside cards); keep raised surfaces clearly distinct from the ground in both themes.
- Green communicates active, freshness, or verified-positive state; it is not decorative brand fill.
- Do not add AI sparkles, glowing gradients, robots, literal radar graphics, blur-heavy glass, or fictional engagement metrics.
- Preserve the approved mobile orders. Homepage: search, horizontal categories, editorial shortlists, newest tools, category-group shelves (Find by goal and Collections live in the desktop sidebar and the mobile header menu). `/tools`: search, horizontal categories, catalogue filters and results, Collections, then editor picks.
- Editorial pages (`/best`, `/alternatives`, `/compare`) follow `docs/editorial-standard.md`. Write new articles as `status: "draft"`; only the maintainer publishes them.

## Local verification

- `pnpm dev` uses ignored `wrangler.production.jsonc` for production D1/R2
  read-only preview when present; fresh clones use isolated local demo data.
  `pnpm dev:demo` always uses `.wrangler/demo`, initialized by `pnpm demo:setup`.
- Keep production configuration, secrets, database exports, and research bundles
  out of Git. Remote commands must explicitly select the private configuration.
- Do not test submissions, edits, deletions, seeds or migrations against production.
  Use isolated test fixtures for write paths; see `docs/environment.md`.
- About ranking has no public navigation entry. Keep Guides navigation hidden
  until useful content and its release are approved.

## Deployment

- Production deploys run only from a maintainer machine with `pnpm run deploy`,
  which reads the ignored `wrangler.production.jsonc`. `pnpm deploy` is a
  built-in pnpm command and does not run this script.
- No Git-connected pipeline deploys this repository; pushing to `main` runs CI
  only. Do not reconnect Cloudflare Workers Builds or add CI deploy steps: a
  clean checkout falls back to the demo `wrangler.jsonc`.
- Do not rename the demo Worker in `wrangler.jsonc` or merge automated PRs
  that change it to match production.
- Deploy only when the maintainer asks, then verify the live homepage,
  `/submit`, sitemap and canonical URL.

## Catalogue research standard

- New manual and scheduled imports must follow `docs/catalog-profile-standard.md`. Granola is the approved content-depth reference; a short description and screenshot alone are insufficient.
- `analysis.profile` is required for publishable imports. Read the research contract even if an older Schedule prompt lists only the basic analysis fields.
- Use HTTP crawling for official-site content, then have Codex clean and verify the saved evidence into `analysis.profile`. Do not routinely re-read those pages through Computer Use.
- Capture one 1440 × 900 website preview per product through Cloudflare server-side Browser Rendering (`pnpm imports:screenshots`). Reuse valid captures. Never launch local Chrome or a temporary browser profile for imports.
