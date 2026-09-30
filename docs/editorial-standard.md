# Editorial pages standard

Status: approved structure for best-of, alternatives and comparison pages.

Editorial pages answer one search intent each: *which tools suit this job*
(`/best/[slug]`), *what to use instead of X* (`/alternatives/[slug]`) and *X or
Y* (`/compare/<left>-vs-<right>`). They hold judgement only. Pricing, free
limits, platforms and check dates are read live from each tool's researched
profile (`docs/catalog-profile-standard.md`), so an article cannot drift from
the catalogue.

## Where content lives

- One TypeScript file per article in `src/content/editorial/{best,alternatives,compare}/`,
  typed by `src/lib/editorial/types.ts`, statically imported in
  `src/content/editorial/index.ts` (Workers has no runtime filesystem).
- `src/lib/editorial/editorial.test.ts` validates every registered article with
  `validateEditorialPage`. `pnpm test` must pass before an article merges.
- Demo fixtures in `src/content/editorial/demo.ts` load only with `ORDALIN_DEMO=1`.

## Workflow

1. Draft with `status: "draft"`. Drafts render in local development (or with
   `ORDALIN_EDITORIAL_PREVIEW=1`) with a draft notice listing unpublished tools.
   Production never serves them.
2. Every named tool must be imported under the researched-profile standard
   first. Do not describe facts the profile does not establish.
3. The maintainer reviews and sets `status: "published"` with the publish date.
   Only the maintainer publishes.
4. A published page is live and indexable only when complete: at least three
   published picks (best, alternatives), the alternatives anchor published, or
   both comparison sides published. If a tool leaves the catalogue, the page
   returns 404 and leaves the sitemap until revised.

## Content requirements

All kinds:

- `description` 70–170 characters, factual, no superlatives or hype.
- `intro`: what the reader is choosing and what actually differs. No filler.
- At least three FAQ entries answering real questions; answers must agree with
  the tools' profiles.
- `author` is `Ordalin` unless a named person wrote it.
- Say when a judgement comes from documentation rather than hands-on use.

Best-of: 3–8 picks. Each pick has an award-style `label`, `bestFor`,
`notIdealIf` and a one- or two-paragraph `summary` of what separates it from
the other picks. Add `criteria` (how we chose), a `decisionGuide` mapping
situations to picks and a short `closing` take.

Alternatives: the anchor is the tool being replaced and is never a pick.
`whySwitch` lists concrete reasons people leave it (price, platform, privacy,
missing feature), each supported by the anchor's profile. 3–8 picks as above.

Compare: a one- or two-sentence `verdict` that actually chooses by situation,
two or more `chooseIf` reasons per side and four or more `differences` rows.

## Never

- Paid placement, affiliate-driven ordering or sponsored verdicts.
- Invented ratings, user counts, test scores or testimonials.
- Vendor marketing copy presented as our finding.
- Pages generated in bulk without per-page judgement.
