# Ordalin

Ordalin is an inventory-first AI tools discovery and decision site for
global-English users. It helps people discover reviewed tools through search,
deterministic filters, categories, new arrivals, Editor Picks, and curated
collections. Its controlled goal layer, modelled internally as Tasks and shown
to visitors as **Find by goal**, starts from a concrete outcome and narrows the
choice to a small set of verified options.

The approved product concept is **Navigation Radar**. The approved brand identity is **Editorial Cut**. The approved product design language is **Quiet Radar**.

## Project status

As of 27 August 2026, the Phase B public directory and Phase C intake are live
on `ordalin.com`. The Navigation Radar homepage, category and tool pages,
paginated catalogue, collections, deterministic search, metadata, sitemap, and robots rules run
from the production D1 catalogue. Public submission starts from the official
website, uses a low-cost OpenAI model to prefill editable facts, accepts a
crawled or uploaded product mark, publishes a new unique-domain profile, and
captures a fixed 1440 × 900 first-viewport website preview.

The direct-live import pipeline and Cloudflare Access-protected
`/admin/imports` queue are deployed. The local Codex Schedule runner can prepare
up to 10 new unique official-site candidates per batch from Product Hunt,
analyze only official-site evidence, enforce a 20-publication safety cap per
batch and per Melbourne calendar day, and route ambiguous or incomplete
records to permanent skipped history. The first manual production batch
processed 20 candidates successfully; the recurring Schedules are active at
09:00 and 17:00 Melbourne time. Browsing uses category groups plus concrete
nested categories rather than a single flat list.

Phase B.5 is live with five goals under **Find by goal**. Each
goal page first offers three plain-language situations, then explains the fit,
pricing, difference, limitation, and freshness of the matching tools. Categories
remain the broad browsing taxonomy; Tasks remain the internal data model. Visit
duration is diagnostic rather than a goal: qualified outbound tool visits and
repeat visits are the primary product signals.

The MDX-backed Guides routes are ready for evidence-led editorial content. No
guide is published yet, so the empty index remains noindex and outside the
sitemap. The future month archive is reserved in documentation and will derive
from existing publication timestamps without a database migration.

Plausible and GA4 pageview tracking are implemented for the production domains
only. Local and preview hosts do not send analytics. Deployment and actual event
reception must be verified separately; configuration is in
[docs/environment.md](docs/environment.md#website-analytics).
Qualified outbound and task-to-tool progression events remain the next
measurement milestone.

## Sources of truth

| Area | Authoritative file |
| --- | --- |
| MVP scope, routes, data, ranking, and operations | `MVP_PLAN.md` |
| Submission, outbound-link, logo, and website-preview behavior | `docs/catalog-enrichment.md` |
| Guide authoring and future time-archive behavior | `docs/guides.md` |
| Product design language and component rules | `docs/design-system.md` |
| Platform-neutral semantic design tokens | `docs/tokens.json` |
| Web token adapter | `docs/design-tokens.css` |
| Logo construction and usage | `brand/BRAND_GUIDELINES.md` |

Exploration folders preserve decision evidence. They are not alternative active specifications: use the approved files above when implementing the product.

## Approved design summary

- System, Light, and Dark appearance modes with a saved user preference.
- Calm, high-trust, search-first discovery without hiding inventory behind search.
- Mist-white and mineral surfaces in light mode; ink and mineral surfaces in
  dark mode; restrained green remains a state color in both.
- Solid performant layers; no blur-heavy glass or generic AI visual effects.
- Desktop-first at 1440 px with an approved compact transformation at 390 px.
- No invented ratings, saves, usage, popularity, or sponsorship signals.

## Quick start

Requires Node.js 22 and pnpm 10. No Cloudflare account or API key is needed for
the local catalogue demo.

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm demo:setup
pnpm dev:demo
```

Open `http://localhost:3000`. The demo uses the checked-in catalogue seed and
isolated D1/R2 storage under `.wrangler/demo`. It does not copy the live catalogue
or download product screenshots. Submissions and admin writes are disabled in
development; write-path tests use isolated fixtures.

On a fresh clone, `pnpm dev` also uses the demo. Maintainers with an ignored
`wrangler.production.jsonc` retain read-only production preview through
`pnpm dev`; `pnpm dev:demo` always selects local fixtures.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:submissions:runtime
pnpm build
```

## Deploy your own instance

Copy `wrangler.production.example.jsonc` to `wrangler.production.jsonc`, provision
your own Cloudflare resources, and configure your domain and secrets. Deployment
and remote maintenance commands require that private configuration. See
[environment setup](docs/environment.md) for the full procedure.

Production catalogue data, user submissions, credentials and local research
bundles are not included. The import automation needs your own authenticated
Cloudflare account and research workflow; it is not required to run the demo.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) for development and pull requests,
[SECURITY.md](SECURITY.md) for private vulnerability reporting, and
[the publication checklist](docs/open-source-release.md) for repository release
checks. Product scope and design decisions remain in the sources of truth above.

## License and assets

See [LICENSE](LICENSE) for the code license and [NOTICE.md](NOTICE.md) for
branding and third-party material. Ordalin branding identifies the official
project; independently operated instances should use their own identity.
