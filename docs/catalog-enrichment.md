# Catalogue enrichment contract

Status: shared bounded fetcher used by public submission and internal review tools

Ordalin enriches a known product URL into evidence-bearing candidates. The
fetcher itself never publishes a tool, replaces editorial copy, or treats a
vendor claim as an Ordalin recommendation. Publication policy belongs to the
calling workflow.

## Canonical public profile

The canonical tool profile uses these content groups:

- identity: product name, canonical domain, provenance-bearing logo, and factual tagline;
- decision context: what it does, plus suitable situations, key difference, and
  material limitation only when a published task mapping supplies those facts;
- commercial facts: pricing model and the official pricing source;
- availability: platforms or interfaces, categories, and controlled attributes;
- evidence: source URL and the date Ordalin last checked it;
- navigation: relevant Find by goal pages and official website action;
- assets: a provenance-bearing product logo and one fixed-viewport website preview.

Community ratings, estimated traffic, saves, and popularity claims are not part
of this contract. Generated catalogue summaries must remain factual and cite
the fetched official-site evidence; scheduled refreshes of existing screenshots
remain deferred.

Profile presentation is source-aware. Manual catalogue records may use
`Reviewed tool profile`; Toolify and Product Hunt imports use
`Website-checked tool profile`. A public submission is published only after
back-office research, so it uses `Reviewed tool profile`; `Submitted tool
profile` remains only for older submissions published without research.
The overview shows pricing, availability, and primary group once. The factual
description is followed immediately by the website preview in the primary
detail column, before any real task-specific decision notes. Profiles without
task mappings omit decision notes rather than generating a generic substitute.
Website previews preserve the fixed 1440 × 900 capture while fitting the primary
column beside the facts panel.

## Official website URL and outbound-link policy

The official website URL stored in `tools.website_url` is a clean canonical
product URL. Before storage, remove fragments and directory attribution
parameters (`utm_*`, `ref`, `referrer`, `source`, `via`, `affiliate`, and
`aff`) while preserving product-functional query parameters. Use this clean URL
for domain deduplication, enrichment, evidence fetches, screenshot capture,
structured data, and canonical product identity. Never store Ordalin's outbound
tracking parameter in D1.

Only visitor-facing actions that open the official product website add
`utm_source=ordalin`, at render time. Existing non-tracking query parameters and
fragments are preserved, and an existing `utm_source` value is replaced. The
rule applies consistently to directory rows, tool profiles, and Find by goal
options. Fact-source links, directory provenance links, social links, evidence
URLs, and asset URLs do not receive Ordalin UTM parameters.

| Record relationship | Stored URL | Public official-site link |
| --- | --- | --- |
| Manual, Toolify, or Product Hunt | Clean official URL | `utm_source=ordalin`; `rel="noopener"` |
| Public submission | Clean official URL | `utm_source=ordalin`; `rel="noopener ugc"` |
| Future paid or affiliate placement | Clean official URL; commercial terms stored separately | Required campaign parameters; `rel="noopener sponsored"` |

Do not emit a non-standard `dofollow` value. Ordinary links are followable when
`nofollow`, `ugc`, or `sponsored` is absent. Public official-site links omit
`noreferrer` so the destination can receive normal referrer information;
provenance and internal admin links may retain it.

## Bounded fetch behavior

Run the internal command with one or two known public product URLs:

```bash
pnpm enrich:tool -- https://example.com https://second.example
```

The fetcher:

- accepts HTTPS public targets only;
- reads `robots.txt` before product pages;
- follows at most three validated HTTPS redirects;
- fetches at most four same-site pages by default;
- limits each HTML response to 512 KB and each request to eight seconds;
- discovers only pricing, feature, documentation, security, and privacy pages;
- keeps compact evidence metadata rather than raw HTML;
- emits a versioned `pending_review` JSON candidate to standard output.

Candidate fields retain their source URL and, when available, the exact short
signal that triggered extraction. Logo, icon, and social-preview URLs are
separate candidates; the public submitter or an internal operator must choose a
valid product mark before an immutable asset is stored in R2.

### Logo discovery and backfill

Product marks are discovered independently from social previews. The ordered
sources are structured-data organization or application logos, declared icon
and Apple touch links, Web App Manifest icons, clearly labelled page logo
images, and standard same-origin favicon/icon/logo paths. `og:image` remains a
social-preview candidate and is never offered as a product mark.

Backfill missing published-tool logos locally with:

```bash
pnpm catalog:logos -- --local
```

After reviewing a dry run, the same operation can target provisioned Cloudflare
resources with `--remote`. The command downloads bounded public images, rejects
unsafe SVG, converts the selected official asset to a padded 512 × 512 WebP,
stores it under a content-hashed R2 key, updates `logo_asset_key`, and appends an
asset-provenance moderation event. Existing logos are skipped unless `--all` is
provided.

### Website preview capture and backfill

During a public submission, Cloudflare Browser Rendering captures the official
website before confirmation; when a submission arrives without one, the
back-office import captures it before publication. The preview is always the
first desktop viewport at 1440 × 900 and device scale factor 1; it is not a
full-page screenshot. Ordalin requests WebP at quality 82, rejects files over
4 MB or with unexpected dimensions, stores the result under an immutable
content-hashed R2 key, and records provenance in a moderation event. Capture
failure is logged and does not roll back publication.

Backfill missing published-tool previews locally with:

```bash
pnpm catalog:screenshots -- --local
```

The backfill uses Cloudflare server screenshots with the same fixed dimensions and supports
`--remote` after the production bucket and database migrations are ready.

## Review boundary

Daily directory imports use a deterministic gate after Codex analysis. A record
publishes directly only when every required official-site evidence,
classification, pricing, crawler, and screenshot check passes. Ambiguous,
incomplete, non-AI, and screenshot-failed records are stored as permanent
skipped history without a tool profile or review task. Toolify and Product Hunt
contribute only the official URL and provenance, never facts used in the
generated catalogue entry.

The public `/submit` workflow persists the same candidate as a short-lived
private draft. The submitter corrects the public fields, chooses a discovered
image, uploads a replacement, or keeps the letter fallback, then submits a new
unique-domain profile for review. The submission is stored as a hidden
`pending_review` tool and a `pending` submission; nothing is public yet.
Existing canonical domains stop at duplicate detection and cannot be
overwritten anonymously; a domain already in review is reported as such.

Ordalin then researches the submission to `docs/catalog-profile-standard.md`
in the back office:

```bash
pnpm imports:prepare -- --remote --submissions --output-dir=<dir>
# analysis.profile written and verified in each bundle, then:
pnpm imports:screenshots -- --manifest=<dir>/manifest.json
pnpm imports:apply -- --remote --manifest=<dir>/manifest.json --publish-limit=20 --daily-publish-limit=20 <bundles>
```

`--submissions` adds every submitted domain still in review (at most 10 URLs
per manifest in total). Apply recognises the pending submitted tool, keeps its
slug, mark and confirmed screenshot, replaces the facts and taxonomy with the
researched analysis, publishes it, and marks the submission `accepted`. A
submission is never skipped permanently: an incomplete profile or failed
screenshot throws and leaves it hidden for a later retry. Published
submissions count toward the daily publish limit.

Submission URLs pass through the same canonical cleaning before enrichment or
deduplication. A submitted profile remains `ugc` even if another source later
rediscovers the same domain.
