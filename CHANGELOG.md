# Changelog

## [0.5.0] - 2026-08-27

### Added

- Server-side homepage search, category and pricing filters, date-added sorting, and URL-addressable 12-item pagination.
- Twice-daily catalogue discovery with Melbourne-aware run directories, up to 30 candidates per run, and manifest-scoped publication accounting.

### Changed

- The homepage uses one unified catalogue instead of separate Today and New feeds, and the category rail no longer displays misleading inventory counts.
- `/new` permanently redirects to the homepage and is no longer linked from navigation or the sitemap.
- Scheduled imports run at 09:00 and 17:00 Melbourne time with matching per-batch and per-day publication limits of 20.

### Fixed

- Homepage filters now run in D1 before pagination, so result totals and pages reflect the complete matching catalogue.
- Import retries safely finalize stale automatic records, preserve unrelated pending work, and time out stalled asset steps.

### Removed

- Unused Today/New client-side date helpers and tests.

## [0.4.0] - 2026-08-26

### Added

- MDX-backed Guides index and static article routes with source-controlled metadata, Article structured data, related catalogue links, and Cloudflare-compatible loading.
- Guide authoring documentation and a future `/archive/[year]/[month]` contract derived from existing publication timestamps without a database migration.

### Changed

- The homepage now defaults to New when no tools were published today while preserving explicit Today and New choices.
- The empty Guides index remains noindex and outside the sitemap until the first guide is published.

## [0.3.0] - 2026-08-26

### Added

- Visitor-facing official website links now add `utm_source=ordalin` at render time across directory rows, tool profiles, and Find by goal options.
- Source-aware outbound relationships distinguish curated and imported links from user-submitted `ugc` links.

### Changed

- Catalogue discovery and public submissions now share one URL policy that removes third-party attribution before storage, crawling, deduplication, and screenshot capture.
- The catalogue enrichment and import runbooks now define the durable rules for official-site, provenance, submitted, and future sponsored links.

## [0.2.2] - 2026-08-26

### Changed

- Tool profiles now place the fixed-viewport website preview directly beneath the factual description, removing the empty primary-column gap beside website facts.
- Daily catalogue imports permanently skip ambiguous or incomplete candidates instead of adding new `pending_review` work, while retaining the 20-candidate daily cap.

### Fixed

- Screenshot capture failures now preserve a skipped import record while removing only the unpublished temporary tool created by that import run.

## [0.2.1] - 2026-08-25

### Changed

- Tool profiles now place factual descriptions and available task-specific decision notes before a quieter, narrower website preview.
- Profile, facts, and source labels now distinguish manually reviewed tools, website-checked imports, and user submissions.
- The overview ledger uses three concise facts on desktop and a clean single-column layout on small screens.

### Fixed

- Removed duplicate pricing and freshness facts from tool profiles while preserving the visible checked date and evidence source.
- Website preview loading now follows whether the image can appear in the initial viewport.

## [0.2.0] - 2026-08-25

### Added

- Low-cost OpenAI analysis with structured catalogue fields for website-first public submissions.
- Daily local catalogue discovery from Toolify and Product Hunt, with official-site resolution, cross-source deduplication, a 20-item cap, and deterministic publish/review/skip decisions.
- A Cloudflare Access-protected import review queue with auditable publish and reject actions.

### Changed

- Submission enrichment now uses bounded official-site evidence to prefill editable fields before publication.
- Logo and screenshot backfills support individual tools and pending-review candidates so automatic publication only happens after required assets exist.
- High-confidence imports publish directly while ambiguous candidates enter `pending_review` and clearly non-AI products are skipped.

### Fixed

- Cloudflare Access team-domain configuration is retained across Wrangler deployments.
- Cloudflare Access JWT issuer validation now matches the issuer emitted for authenticated sessions.

## [0.1.0] - 2026-08-24

### Added

- Public website-first submissions with bounded enrichment, submitter confirmation, duplicate blocking, Turnstile protection, and automatic publication.
- Provenance-aware product-logo discovery, normalized R2 assets, and deterministic letter fallbacks.
- Fixed 1440 × 900 first-viewport website previews through Cloudflare Browser Rendering, plus local and remote backfill commands.
- Thirteen public category groups, 28 concrete nested categories, and indexable group/category routes when inventory thresholds are met.
- System, Light, and Dark appearance modes; controlled Find by goal pages; catalogue search, filters, collections, New feed, metadata, and sitemap support.

### Changed

- Tool profiles now present richer verified facts, concrete categories, product marks, and website previews.
- Public category navigation hides empty groups and the inactive internal `Other` fallback.
- `ordalin.com` is the production canonical origin and `www.ordalin.com` redirects to it.

### Fixed

- Long category labels such as Coding & Development stay left-aligned on one line in the desktop rail.
- Fresh D1 databases create category groups before category-tag foreign keys are assigned.
- Remote D1 seed imports rely on Wrangler's atomic file execution instead of unsupported explicit SQL transactions.
- Production metadata uses the live workers.dev origin until the custom domain is attached.
- Canonical-host redirects run as Edge Middleware for OpenNext compatibility.
