# Ordalin — MVP product and technical plan

Date: 22 August 2026
Last updated: 27 August 2026
Status: Phase B, Phase B.5, and Phase C live; first production import batch complete and recurring Schedules active
Market: global English
Reference projects: fablepilot (primary), scribix (secondary)

Project identity: the repository and brand are both named **Ordalin**.

## 1. Product decision

Build an inventory-first AI tools discovery and decision site. Categories support
broad browsing; controlled task pages help visitors choose a tool for a specific
outcome. The launch product is not a chatbot, automated recommendation engine,
community, or news aggregator.

The MVP contains:

- Navigation Radar homepage
- category and tool detail pages
- controlled task-led decision pages
- search and deterministic filters
- paginated chronological catalogue and curated collections
- website-first free submission with submitter confirmation and automatic publication
- daily Product Hunt discovery with deterministic automatic publication and permanent exception skipping
- internal moderation for imported and existing catalogue records
- sitemap, robots rules, metadata, and structured data

The MVP does not contain public accounts, saves, comments, user reviews, a
standalone comparison builder, reciprocal-link automation, sponsorship,
or multilingual pages. Editorial task pages may explain differences
between a small set of tools, but they do not create behavioural rankings or
invent engagement data.

### Approved brand and product design

- Brand name: **Ordalin**.
- Logo system: **Editorial Cut**; use the production assets and rules in `brand/BRAND_GUIDELINES.md`.
- Main theme: **Quiet Radar**, approved 23 August 2026.
- Appearance modes: **System**, **Light**, and **Dark**. System is the default;
  explicit choices persist locally and apply before first paint.
- Design source of truth: `docs/design-system.md`, with semantic values in `docs/tokens.json` and `docs/design-tokens.css`.

Exploration artifacts document how the decision was reached but are not alternative implementation specifications.

## 2. Technical baseline

Use fablepilot as the main template:

- Next.js App Router under src/app
- TypeScript strict mode and pnpm
- Tailwind CSS
- Next.js on Cloudflare Workers through OpenNext
- Drizzle ORM with D1 schema and generated SQL migrations
- Vitest for domain and repository tests
- local Codex Schedule for low-volume background catalogue discovery
- Cloudflare Git integration for the root app
- explicit migration/Worker deployment ordering before pushing the app

Borrow selectively from scribix:

- a small asynchronous Cloudflare binding helper
- separate scheduled Worker convention
- dynamic sitemap and robots patterns
- production deployment checks

Do not copy billing, quotas, Better Auth/NextAuth, dashboards, user tables, or next-intl. Do not introduce Durable Objects, Queues, or Workflows until a measured need appears.

Architecture:

    Next.js Worker
    ├── public directory pages
    ├── search, filter, and submit handlers
    ├── protected moderation pages
    ├── D1 binding
    └── R2 binding

    Local Codex Schedule
    ├── Product Hunt public-page discovery
    ├── official-site bounded evidence fetch
    ├── Codex catalogue analysis
    ├── deterministic publish/skip gate
    ├── Cloudflare server screenshot capture
    └── Wrangler access to remote D1 and R2

## 3. Route and page architecture

| Route | Purpose | Indexing |
| --- | --- | --- |
| / | Shelf homepage: search, categories, editorial shortlists, newest tools, one shelf per category group, goals and collections | Index |
| /tools | Full searchable, filterable, paginated catalogue (the former homepage catalogue) | Index unfiltered pages; filters noindex |
| /best, /best/[slug] | Editorial best-of hub and shortlists (see `docs/editorial-standard.md`) | Index when published and complete |
| /alternatives, /alternatives/[slug] | Editorial alternatives to a well-known tool | Index when published and complete |
| /compare, /compare/[slug] | Editorial head-to-head comparisons (`<left>-vs-<right>`) | Index when published and complete |
| /about/how-we-review | Public editorial and research policy | Index |
| /tools/[slug] | One canonical tool profile | Index when published |
| /categories/[group] | Category-group index and paginated catalogue | Index when sufficiently populated |
| /categories/[group]/[category] | Concrete category and matching tools | Index when sufficiently populated |
| /tasks | Controlled task index | Index when useful task pages exist |
| /tasks/[slug] | Editorial decision page for one concrete outcome | Index with unique copy and at least three verified tools |
| /new | Permanent redirect to /tools | Redirect |
| /guides | Evidence-led guide index | Noindex while empty; index when guides exist |
| /guides/[slug] | One static MDX decision guide | Index when published |
| /collections | Curated collection index | Index |
| /collections/[slug] | Editorial tool collection | Index |
| /search?q= | Search and filters | Noindex, follow |
| /submit | Free submission form | Index |
| /about/ranking | Legacy policy URL; no public navigation entry | Noindex; excluded from sitemap |
| /admin/* | Review queue and catalogue operations | Noindex; Cloudflare Access |
| /api/* | Mutations and internal endpoints | Disallow |

Filter parameters must not create indexable URL combinations. Categories, tasks,
collections and editorial pages are the controlled SEO landing pages. Old homepage
catalogue URLs (`/?q=`, `category`, `pricing`, `sort`, `page`) permanently redirect
to the same query on `/tools`.

## 4. Homepage and catalogue contract

The homepage (`/`) is a category sidebar beside a column of shelves; the full
Navigation Radar catalogue lives at `/tools`. Desktop layout:

- promise and search (submits to `/tools?q=`) above the two columns;
- a sticky sidebar panel listing All tools and every category group with its
  published tool count, then Browse links (Find by goal, Collections, Best-of
  lists, Comparisons — each only when it has content);
- a content column of editorial shortlists (only when live editorial pages
  exist), newest tools, then one four-tool shelf per category group: editor
  picks first, then newest, with links to the group page and its best-of list
  when one is live.

Mobile and DOM order of the homepage:

1. compact promise and search
2. horizontally scrollable category groups (counts and Browse links hidden;
   Find by goal and Collections stay reachable through the header menu)
3. editorial shortlists
4. newest tools
5. category-group shelves

Homepage rules:

- show real tools in the first viewport without requiring search;
- shelves show logo, name, factual purpose, pricing model and Editor pick state;
- counts come from D1; never show fictional popularity, saves or trending data;
- sponsored inventory is absent in MVP;
- submission remains a persistent secondary action.

`/tools` keeps the previous catalogue rules: newest-first by default with
oldest-first sorting, URL-addressable pagination, filters and search, and the
mobile order search, categories, filters and results, collections, editor picks.

### Public navigation

- Primary navigation shows All tools, Best of, Compare, Find by goal and
  Collections, with Submit a tool as the secondary action. Best of and Compare
  appear only when their hubs have visible pages.
  At 820 px and below the links move into a header menu button; Submit a tool
  stays visible beside it.
- The footer lists Browse, Best of, Compare (when content exists) and Ordalin
  (How we review, Submit a tool, GitHub).
- Do not expose About ranking in the header, footer, or homepage sidebar.
- Hide Guides navigation until useful articles are available and its entry is
  approved for release. Empty Guides remains noindex and outside the sitemap.

## 5. Initial taxonomy and launch inventory

Start with thirteen public category groups:

1. Writing & Language
2. Image & Design
3. Video & Animation
4. Voice & Speech
5. Music & Audio
6. Coding & Development
7. Automation & Agents
8. Productivity
9. Research & Data
10. Marketing & Sales
11. Business & Operations
12. Education & Learning
13. Personal & Lifestyle

Keep `Other` as an inactive internal fallback. Public navigation shows only
groups that contain published inventory, so empty groups do not create dead
ends. Tools have one primary group and one or more concrete categories stored as
controlled `category` tags linked to a group. The launch seed defines 28
concrete categories. Promote nested category pages to the sitemap only when
inventory and search demand justify indexing them.

### Task-led decision layer

Tasks express an action or outcome, not another broad tool type. For example,
`Video` is a category; `Turn a long video into short clips` is a task.

`Task` is the internal content and data term. The public navigation and page
label is **Find by goal**; do not expose unexplained labels such as `Tasks` or
`Decision guides` in the interface. The index asks what the visitor wants to
accomplish. Each goal page first presents three concrete situations in the
visitor's language, then provides the supporting comparison details.

Phase B.5 starts with four to six manually selected tasks derived from the
reviewed catalogue. Each published task page contains:

- three to five published, recently verified tools;
- a concise outcome statement and selection guidance;
- best fit, pricing model, key differences, material limitations, and last
  checked information for each option;
- clear paths to the canonical tool profile and official website.

Categories remain the primary catalogue taxonomy. Find by goal is the second
entry point for people who arrive with a concrete job. Do not mass
generate task pages, turn category names into tasks, or publish thin pages to
manufacture SEO inventory. A task page stays unpublished or noindex until it has
unique editorial copy and at least three useful verified options.

Tasks use dedicated `tasks` and `task_items` tables. `task_items` stores the
editorial order, best fit, key difference, and limitation for each tool option;
controlled tags are not overloaded with task semantics.

Initial publication gate:

- 12 reviewed, published tools are sufficient for the initial functional and
  product-direction validation set;
- category pages remain noindex until they contain at least 15 useful tools;
- at least six manually curated collections;
- no empty category pages;
- imports publish automatically only when every deterministic evidence and
  classification gate passes; ambiguous records are permanently skipped.

## 6. D1 data model

Use application-generated text IDs and integer Unix timestamps, following fablepilot.

### Core tables

**tools**

- id, slug, name
- tagline, description
- website_url, canonical_domain
- pricing_model
- status: imported, pending_review, published, rejected, or archived
- primary_category_id
- logo_asset_key, screenshot_asset_key
- is_editor_pick
- source_first_seen_at, published_at, last_checked_at
- created_at, updated_at

Constraints:

- unique slug
- unique normalized canonical_domain for ordinary products
- indexes on status/published date, category/status/published date, and editor-pick/status

**categories**

- top-level category groups
- id, slug, name, description, sort_order, is_active

**tool_categories**

- tool_id, category_id, is_primary
- unique tool/category pair

**tags** and **tool_tags**

- concrete categories plus controlled interface and attribute facets
- category tags carry category_group_id; interface and attribute tags do not
- examples include Dictation, Coding assistant, API, Open source, and No-code

**tool_sources**

- id, tool_id
- provider: product_hunt, toolify, submission, or manual
- external_id, source_url, raw_json
- first_seen_at, last_seen_at
- unique provider/external ID pair

**submissions**

- submitted name, website, email, description, and suggested category
- status: accepted, rejected, or duplicate
- Turnstile metadata, publication result, and timestamps
- submitter email is never public

**submission_drafts** and **submission_attempts**

- short-lived website enrichment candidates awaiting submitter confirmation
- normalized canonical domain, expiry, hashed actor key, action, and timestamps
- no raw IP address is stored

**collections** and **collection_items**

- indexable curated groups with explicit order and editorial copy

**ingestion_runs**

- provider, cursor, start/completion timestamps
- fetched, imported, duplicate, and error counts
- status and bounded error summary

**moderation_events**

- append-only audit trail for publish, reject, merge, edit, and archive

### Search

Create a D1 FTS5 virtual table over published tool name, tagline, description, category names, and tags. Synchronize it through repository functions or explicit migration triggers. Search must still enforce published status.

Do not store images, raw HTML, or large enrichment payloads in D1.

## 7. R2 asset model

Use one catalogue-asset bucket:

    tools/{toolId}/logo/{contentHash}.webp
    tools/{toolId}/screenshots/{contentHash}.webp
    imports/product-hunt/{externalId}/{contentHash}.json

Rules:

- immutable content-hashed keys prevent stale overwrites;
- D1 stores only active object keys and metadata;
- validate MIME type, dimensions, and size;
- provide a deterministic letter-mark fallback;
- preserve source URL and provenance internally;
- serve public assets through an R2 custom domain with long cache headers;
- replace assets by changing keys rather than overwriting;
- clients never receive direct R2 credentials or upload URLs.

## 8. Daily catalogue ingestion

No source API and no always-on ingest Worker are required for the MVP. A local
A local Codex Schedule runs twice per day, at 09:00 and 17:00 Melbourne time,
while the Codex desktop app and this Mac are available. Product Hunt
public pages are the only active discovery source (Toolify discovery is disabled):
the pipeline extracts their official product URL and never treats directory
copy as catalogue evidence.

Scheduled flow:

    Codex Schedule
    → read the Product Hunt homepage
    → resolve each source listing to its official website
    → deduplicate by provider ID and normalized official domain
    → prepare at most 10 new unique website candidates per batch
    → fetch bounded homepage, pricing, documentation and help evidence
    → let Codex create one Granola-standard, claim-cited researched profile at a time
    → apply the deterministic publish/skip gate
    → stop at 20 publications per batch and per Melbourne calendar day
    → fetch the official logo when available
    → capture one Cloudflare server screenshot and store a reviewed 1440 × 900 preview
    → publish only complete high-confidence records

New imports follow `docs/catalog-profile-standard.md`; basic-only descriptions
cannot publish. Missing core research remains local and retryable. Granola
remains the approved depth reference.

Gate outcomes:

- `published`: the official site establishes an AI product; all required facts,
  pricing, taxonomy selections, concrete category, evidence URLs, and screenshot
  pass deterministic checks;
- `skipped`: the official site does not establish an AI-enabled product, or any
  required field is ambiguous, unsupported, contradictory, outside the
  taxonomy, affected by a crawler warning, or missing a screenshot;
- `failed`: an operational or structural error prevented a reviewable record.

The same listing or domain is idempotent across both providers. One broken
listing or provider does not fail the other candidates. Existing published
editorial fields are never overwritten by a source reappearance. Scheduled
analysis uses the Codex subscription; the public submit form separately uses a
small OpenAI API model because it must respond interactively to website users.

## 9. Submission and moderation

Public submission:

- no account required;
- begin with an HTTPS public product website and extract a bounded set of public facts;
- let the submitter correct the name, tagline, description, pricing, categories,
  platforms, attributes, product mark, features, pricing details, use cases, and
  explicit limitations before publication; unsupported optional sections stay empty;
- accept a crawled product mark, a validated upload, or the letter fallback;
- Cloudflare Turnstile plus server-side rate limiting;
- normalize the domain before duplicate detection;
- stop duplicate domains and link to the existing profile rather than allowing an
  anonymous overwrite;
- automatically publish a new unique domain after validation and explicit
  submitter confirmation;
- capture one fixed 1440 × 900 desktop first viewport before confirmation; allow
  up to three capture attempts per draft, a validated upload, or no screenshot;
- show a complete profile preview before the final publish action, and publish
  the exact confirmed screenshot without recapturing;
- a failed website read or screenshot capture permits manual completion;
- store confirmed optional fields and server-owned field provenance in the
  submission tool_sources.raw_json envelope; edits lose website-source attribution;
- label these profiles as submitted information, never editorially verified;
- disclose how the contact email is used.

Admin review:

- protected by Cloudflare Access;
- handles Toolify/Product Hunt exceptions, manual catalogue changes, and post-publication
  correction or abuse cases;
- displays duplicate candidates and source provenance;
- supports publish, edit and publish, merge, reject, and archive;
- imported-tool publication requires name, canonical domain, factual tagline,
  primary category, pricing model, and logo or fallback;
- every mutation writes a moderation event.

## 10. Ranking and trust rules

MVP browse states:

- Date added: published catalogue ordered newest first by default, with an oldest-first option
- Editor Picks: explicit manual selection
- Popular on Product Hunt: only when a supported source metric is used and labelled

Trending, Most Saved, and Most Used are deferred until first-party event volume is meaningful and abuse-resistant.

Reciprocal-link status is later stored privately. It never affects organic order or creates a verification badge. Future sponsored placements use separate records and explicit labels.

### Product success measurement

Baseline pageview collection is implemented with the dedicated `ordalin.com`
Plausible site on `actone.app` and Ordalin's GA4 web stream. Trackers load after
hydration only on the production domains and initialize once; local and preview
hosts send no events. Deployment and dashboard reception are separate checks.
See `docs/environment.md#website-analytics` for configuration. The conversion
signals below are product requirements, not claims of implemented custom events.

Ordalin is an outbound discovery product. A visitor who finds a suitable tool
and leaves through its official link may have completed the intended job.
Primary product signals are:

- qualified outbound tool visits, broken down by entry page and task;
- progression from a task or search result to a canonical tool profile;
- repeat visits over seven- and 30-day windows;
- searches with no useful result or repeated query refinement.

Visit duration, views per visit, and bounce rate remain diagnostic metrics, not
the product objective. Outbound visits must be tracked as meaningful conversion
events before interpreting a short single-page session as failure. Behavioural
events do not affect public ranking until volume is meaningful and abuse
controls exist.

## 11. SEO and content rules

- one canonical slug and URL per tool;
- redirect historical slugs after renaming;
- only published tools appear in pages, search, structured data, and sitemaps;
- search/filter combinations are noindex;
- paginate category and `/tools` pages with crawlable links;
- editorial pages (best, alternatives, compare) follow `docs/editorial-standard.md`:
  they are indexable only when published and every required tool is published;
  drafts render only in local preview and never enter the sitemap;
- keep Guides `noindex` and out of the sitemap until the first article is
  published; published MDX guides use canonical Article metadata and factual
  internal links rather than bulk-generated news copy;
- reserve `/archive/[year]/[month]` for a future added-to-Ordalin archive derived
  from `tools.published_at`; do not add schema or expose thin month pages now;
- generate sitemap entries from D1 and split when volume requires it;
- use SoftwareApplication structured data only for verified facts;
- never emit fabricated ratings, prices, reviews, or usage data;
- write factual, distinct descriptions rather than copying vendor text;
- show what it does, pricing model, interfaces/platforms, category, source/last checked, and Visit;
- store and crawl clean official website URLs without attribution parameters;
  add only `utm_source=ordalin` when rendering a visitor-facing official-site
  action, using `rel="noopener"` for curated/imported records and
  `rel="noopener ugc"` for public submissions;
- do not add Ordalin attribution to fact-source, provenance, evidence, social,
  or asset links; reserve `rel="sponsored"` for future paid relationships;
- show best fit, key difference, limitations, and reviewed alternatives only
  when a published task mapping provides real decision context; never generate a
  generic fallback merely to fill the profile;
- mark dead or redirected tools for review before removing public history.

## 12. Caching and performance

- immutable cache headers for framework assets;
- cache public directory reads and revalidate after moderation;
- keep search dynamic;
- avoid per-card D1 queries by returning complete card projections;
- use indexed pagination and move away from large offsets as inventory grows;
- use R2 custom-domain caching;
- benchmark FTS5 and listings with 10,000 generated records;
- inspect query plans and rows-read metrics before adding caches or databases.

One D1 database is sufficient for MVP. The primary risk is inefficient queries, not catalogue size.

## 13. Repository shape

    src/
    ├── app/
    │   ├── tools/[slug]/
    │   ├── categories/[slug]/
    │   │   └── [categorySlug]/
    │   ├── tasks/[slug]/
    │   ├── collections/[slug]/
    │   ├── new/
    │   ├── search/
    │   ├── submit/
    │   ├── about/ranking/
    │   ├── admin/
    │   ├── api/
    │   ├── sitemap.ts
    │   ├── robots.ts
    │   └── page.tsx
    ├── components/
    │   ├── directory/
    │   ├── submissions/
    │   ├── tool/
    │   └── admin/
    ├── db/schema.ts
    └── lib/
        ├── repositories/
        ├── catalog-enrichment/
        ├── submissions/
        ├── catalog-sources/
        ├── search/
        ├── moderation/
        ├── assets/
        └── cloudflare.ts
    workers/catalog-ingest/
    migrations/
    docs/

## 14. Delivery phases

Maintainers can read production catalogue data in read-only mode through their
private configuration. Fresh clones use isolated demo data. See
`docs/environment.md` for binding guards and isolated write-path tests.

### Phase A — foundation and final design

- retain a marked placeholder until naming is handled;
- refine Navigation Radar for desktop and mobile;
- create design-system.md, semantic tokens.json, and homepage component contract;
- scaffold from fablepilot conventions;
- add bindings, Drizzle, migrations, tests, and environment documentation.

### Phase B — public directory

- implement repositories and seed import;
- build homepage, categories, tool page, New, collections, search, sitemap, and robots;
- seed and manually verify a small real catalogue; the 12-tool validation set is acceptable;
- verify accessibility, metadata, structured data, pagination, and performance.

### Phase B.5 — task-led decision layer

- define four to six concrete tasks from the reviewed inventory;
- add the controlled task index and canonical task pages;
- provide three to five verified options with best fit, pricing, differences,
  limitations, and last-checked context;
- connect search and relevant catalogue surfaces to task pages without changing
  the approved mobile content order;
- track qualified outbound visits and task-to-tool progression;
- validate usefulness before expanding the taxonomy or adding account-based
  retention features.

### Phase C — intake and operations

- build website-first free submission with Turnstile, submitter confirmation,
  duplicate blocking, safe logo handling, automatic publication, and fixed
  first-viewport website previews;
- build Cloudflare Access-protected moderation;
- configure the two local Codex Schedules;
- add run history, retries, duplicate merging, and asset provenance.

### Phase D — launch hardening

- test import idempotency and duplicate handling;
- test with 10,000 generated catalogue records;
- verify local bindings and Cloudflare preview;
- document migration and Worker-before-app deployment order;
- complete privacy, ranking, submission, and advertising disclosures;
- launch only when the content gate is met.

## 15. MVP acceptance criteria

The MVP is complete when:

1. Visitors can browse real tools by category or New without searching and can
   use controlled tasks when they arrive with a concrete outcome.
2. Search returns only published tools and combines text, category, price, and tag filters.
3. Every published tool has a canonical, indexable page with supportable facts.
4. Every published task page has unique guidance and three to five verified
   options without fabricated rankings or engagement data.
5. Free submission creates a short-lived private draft, lets the submitter confirm
   extracted facts, automatically publishes one unique-domain profile, and rejects
   obvious duplicate or spam attempts.
6. Running the same Toolify or Product Hunt discovery twice creates no duplicate tools or sources.
7. Imports publish automatically only after the deterministic official-evidence
   and screenshot gate; every exception remains private for explicit moderation.
8. Publishing or archiving updates public pages and sitemap visibility.
9. Assets have safe validation, cache headers, provenance, and a fallback.
10. The project passes lint, typecheck, unit tests, production build, and OpenNext preview.
11. Deployment covers D1 migrations, secrets, the root app, and the local Schedule prerequisites in dependency order.

## 16. Decisions intentionally deferred

- production domain and hosting cutover
- public accounts and authentication
- public saves and behaviour-derived public rankings
- reciprocal-link crawler and partner dashboard
- ownership claims and anonymous edits to existing profiles
- sponsored inventory and billing
- multilingual URLs
- scheduled screenshot refreshes beyond new imports
- Queues, Workflows, Durable Objects, and database sharding

These require evidence from a working directory or materially change the product. They must not enter the MVP accidentally.

## Open-source distribution

The public repository ships isolated catalogue fixtures and a local-only
`wrangler.jsonc`. Fresh clones can run `pnpm demo:setup` and `pnpm dev:demo`
without production access. Maintainers retain read-only production preview via
ignored `wrangler.production.jsonc`; remote deployment and maintenance require
that private configuration. Production data and operator evidence bundles are
not distributed. See `docs/environment.md` and `docs/open-source-release.md`.
