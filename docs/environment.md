# Development environment

Ordalin uses pnpm, Next.js App Router, TypeScript strict mode, Tailwind CSS,
OpenNext for Cloudflare, Drizzle ORM with D1, R2, Cloudflare Browser Rendering,
and Vitest.

## Local setup

Requirements:

- Node.js 22
- pnpm 10

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm demo:setup
pnpm dev:demo
```

The local app is available at `http://localhost:3000`. The public
`wrangler.jsonc` uses local D1/R2 bindings and a dummy database ID. Demo migrations
and seed data live only under `.wrangler/demo`; no Cloudflare login is required.
`pnpm demo:setup` is repeatable, but reseeding restores the checked-in catalogue
fields, so do not use that database for data you need to keep.

Maintainers can keep `wrangler.production.jsonc` locally. If it exists,
`pnpm dev` reads its production D1/R2 through remote bindings after Wrangler
login. On fresh clones without it, `pnpm dev` uses the demo. `pnpm dev:demo`
always selects the isolated demo even when a production configuration exists.

Both development modes are read-only: middleware blocks mutation requests,
application D1 access permits SELECT readers only, R2 permits get/head/list only,
and browser capture is blocked. These application guards do not restrict
maintenance CLI credentials. Do not run production submissions, edits,
deletions, seeds or migrations as local verification.
`pnpm test:submissions:runtime` uses isolated temporary workerd D1/R2 fixtures.

Public submission uses Cloudflare Turnstile. The development bypass is only for
isolated tests without configured keys; local catalogue preview cannot submit.
For production, set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in the build environment and
store `TURNSTILE_SECRET_KEY` and a stable `SUBMISSION_HASH_SALT` as Worker secrets.

Interactive submission analysis uses the OpenAI Responses API. Store
`OPENAI_API_KEY` as a Worker secret and optionally set
`OPENAI_ANALYSIS_MODEL`; the default is `gpt-5.6-luna`. If the key is absent,
submission analysis uses a metadata fallback that the submitter must confirm.
The twice-daily catalogue import does not use this API key: its analysis is
performed by the local Codex Schedules and consumes the Codex subscription
instead.

The private `/admin/imports` page and its mutation API verify Cloudflare Access
JWTs. Configure an Access self-hosted application covering both `/admin/*` and
`/api/admin/*`, then provide its team domain and application audience as
`CLOUDFLARE_ACCESS_TEAM_DOMAIN` and `CLOUDFLARE_ACCESS_AUD`. Production fails
closed when either value is missing.

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:submissions:runtime
pnpm build
```

`pnpm preview` performs an OpenNext remote preview and therefore requires the
Cloudflare resources below to be provisioned first.

## Cloudflare resources

Create a private configuration and resources in your own account:

```bash
cp wrangler.production.example.jsonc wrangler.production.jsonc
pnpm exec wrangler login
pnpm exec wrangler d1 create your-directory-db
pnpm exec wrangler r2 bucket create your-directory-assets
```

Set the Worker name, D1 database ID/name, R2 bucket name, public application URL,
Turnstile site key and Access team domain in `wrangler.production.jsonc`.
Add your custom-domain routes if desired. This file is ignored by Git; never
put API keys or secret values in it.

Pushing to `main` deploys production through Cloudflare Workers Builds:
build command `pnpm run build:production`, deploy command
`pnpm run deploy:production`. The clean checkout has no private configuration,
so the build variable `ORDALIN_WRANGLER_CONFIG` holds
`base64 < wrangler.production.jsonc`; update it whenever that file changes.
Keep builds for non-production branches disabled; previews would bind
production D1 and R2. Apply D1 migrations before pushing code that needs them.
A maintainer can still deploy manually with `pnpm run deploy` (`pnpm deploy`
is a built-in pnpm command, not this script).

`pnpm run deploy`, `pnpm preview`, remote database scripts and remote import/backfill
scripts explicitly use this private file. Direct Wrangler commands must include
`--config wrangler.production.jsonc`, including secret management:

```bash
pnpm exec wrangler secret put OPENAI_API_KEY --config wrangler.production.jsonc
```

Create other required Worker secrets the same way. Set the build-time
`NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` for your deployment;
the local `.env.local` example is not a production build environment.
No catalogue-ingest Worker is used. Scheduled discovery is an optional operator
workflow described in `docs/catalog-import-automation.md`.

`wrangler.production.jsonc` also binds Cloudflare Browser Rendering as `BROWSER`. Public
submission uses it before confirmation to capture a 1440 × 900 desktop viewport.
The submitter can recapture (up to three attempts per draft), upload an image, or
omit the screenshot. Publication stores the exact confirmed image; it does not
recapture in the background. No separate Browser Rendering resource ID is stored
in the repository.

After changing bindings, regenerate their types:

```bash
pnpm cf-typegen
```

Validate schema changes in an isolated database first. Applying a production
migration is a separate release operation, only needed when the release changes
the schema; routine local catalogue preview requires no migrations:

```bash
pnpm db:migrate:local
pnpm db:migrate:remote
```

Populate missing catalogue logos after seeding or importing tools:

```bash
pnpm catalog:logos -- --local
# use --remote only after reviewing the candidate sources and provisioning R2
```

Populate missing fixed-viewport website previews with Cloudflare Browser Rendering:

```bash
pnpm catalog:screenshots -- --local
# use --remote only after applying migrations and provisioning R2
```

Import screenshots: `pnpm imports:screenshots -- --manifest=<manifest.json>`.
This uses the existing Wrangler login and a remote Browser binding isolated from
D1/R2. It saves one image per prepared product and reuses fresh captures. No local
Chrome, Computer Use, new public endpoint, or application deployment is required.

Before enabling the direct-live twice-daily import, apply migrations and verify that
Wrangler can access the remote D1 and R2 resources:

```bash
pnpm db:migrate:remote
pnpm imports:discover -- --remote --limit=1
```

The discovery command only creates ignored local evidence bundles. The Schedule
analyzes and applies them one at a time; applying a bundle can write to remote
D1/R2 and publish it when every gate passes.

Secrets are stored with `wrangler secret put NAME --config wrangler.production.jsonc` in Cloudflare and in a local
`.dev.vars` copied from `.dev.vars.example`. Never place Turnstile secrets,
OpenAI keys, Access tokens, salts, or submitted emails in Wrangler configuration or committed
environment files.

## Product profile content

The Granola sample lives in `src/content/tool-profiles/granola.ts`, with reviewed
sources and separate evidence dates. Its bundled images are under
`public/editorial/`; this sample does not rewrite the production tool record.

New catalogue imports must follow `docs/catalog-profile-standard.md`. Their
claim-cited profiles are stored in `tool_sources.raw_json.analysis.profile` and
rendered with the Granola section structure. The import CLI blocks basic-only
publication. Existing records require separate researched backfill.

New submissions store optional features, pricing details, use cases and explicit
limitations in `tool_sources.raw_json.confirmed`, together with server-owned
field provenance. Missing sections remain hidden. Submitter edits lose website
source attribution. No database migration is required for this envelope.

## Website analytics

The root layout loads Plausible and GA4 after hydration, using the same Plausible
host as Pixfy (`https://actone.app/js/script.js`) with the separate `ordalin.com`
site. Its reporting timezone is Australia/Melbourne.

The official site's public GA4 web-stream ID remains the default in
`src/lib/analytics.ts`. `NEXT_PUBLIC_GA_MEASUREMENT_ID` can override it at build
time; an explicitly empty value disables GA4. This is a public identifier, not a
Worker secret. The public `.env.example` leaves this override blank. Forks must use their own
analytics configuration and hostname allowlist; they must not reuse the official
site's trackers.

Only `ordalin.com` and `www.ordalin.com` load analytics scripts. Localhost,
workers.dev and other preview hosts send no events. Trackers initialize once;
Plausible handles History API navigation and GA4 uses Enhanced Measurement.
Keep GA4 page views on browser-history changes enabled and do not add duplicate
manual page_view events. No Clarity, user IDs, form values or custom business
events are added by this integration. Verify reception on the production site
after deployment; local checks intentionally cannot populate these dashboards.
