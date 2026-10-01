# Researched catalogue profiles

Status: required for new automated imports from 22 September 2026.

Granola is the approved content-depth reference. Its current page is a curated
sample in `src/content/tool-profiles/granola.ts`, with seven official pricing and
help-centre sources. It was not produced by the old short-summary import flow.
The sample remains intact. New products use a reusable data-backed profile with
the same features, plan comparison, free limits, use cases, limitations and
section navigation; no new per-product React component is needed.

## Research before writing

1. Use the existing HTTP crawler and read its saved `candidate.evidencePages`;
   do not repeat this research through Computer Use. Fetch only missing evidence.
   Start with the official homepage. Identify the product, workflow, supported
   platforms, inputs and outputs. Directory copy is discovery provenance only.
2. Read pricing and billing pages. Record current plan names, currency, unit,
   billing cadence, monthly versus annual terms, included usage and meaningful
   differences. Distinguish ongoing free plans, trials, promotional offers,
   open-source licensing, bring-your-own-key costs and paid hosted services.
   A “Start free” button alone is not sufficient pricing evidence.
3. Read feature pages, linked documentation and FAQs. Follow relevant links to
   platform support, exports, retention, integrations and usage limits. Review
   privacy/training/consent documentation when material to the product.
4. Write at least three distinct useful features, a plan comparison, and at least
   one concrete use case supported by the official product workflow. Do not
   pad the page with repeated claims, testimonials or marketing superlatives.
5. Give every factual claim its exact fetched official URL and a verbatim
   supporting quote. The quote must support the whole claim, not merely share
   a keyword. Multiple facts may require multiple quotes. Mechanical quote
   matching verifies provenance; Codex must still verify meaning and accuracy.
6. Report explicit product limitations only. If checked official pages do not
   establish platform support, billing details, free limits or limitations,
   leave that section's array empty and list its key in `unverified`. The page
   says it was not established; this never means “no limitations”. Missing
   core features, plan details or use cases block publication and remain local
   for further research. Do not mark research-in-progress as a permanent skip.
7. Run `pnpm imports:screenshots -- --manifest=<manifest.json>` after preparing
   analysis. It captures one 1440 × 900 homepage image per prepared AI product
   through Cloudflare Browser Rendering and reuses valid captures. Inspect the
   saved image locally; do not open local Chrome. Failed captures remain retryable.
8. Apply one bundle at a time. Verify the published page, its detailed sections,
   citations, check date, Logo and screenshot. A successful D1 write alone does
   not establish that the complete page renders correctly.

Discovery enables bounded research mode: up to ten successful pages (hard cap
12), 1 MB per page, 16,000 characters of cleaned evidence per page, and bounded
request attempts. Pricing and documentation receive priority, then other page
roles receive coverage before repeated pages of one role. Links to subdomains
of the official hostname can be followed, including help centres; unrelated
hosts cannot. Each origin's robots.txt is checked. JavaScript, CSS, SVG,
comments and template payloads are excluded from readable evidence. Structured
SoftwareApplication facts remain available after visible content.

## Bundle contract

Keep the existing basic `analysis` fields and add `analysis.profile`:

```ts
type Evidence = { url: string; quote: string };
type Claim = { text: string; evidence: Evidence[] };
type Feature = Claim & { title: string };
type Plan = {
  name: string;
  price: string;       // Currency and amount, or a supported custom-quote label
  cadence: string;     // e.g. per user / month, annual billing; or one-time
  detail: string;      // Included usage and material differences from other plans
  evidence: Evidence[];
};
type Profile = {
  schemaVersion: 1;
  overview: Claim;
  pricingSummary: Claim;
  platforms: Claim[];
  features: Feature[]; // 3–12 distinct features
  plans: Plan[];       // 1–12; cover all material publicly advertised tiers
  billingNotes: Claim[];
  freeLimits: Claim[];
  useCases: Claim[];   // 1–12
  limitations: Feature[];
  unverified: Array<"platforms" | "billingNotes" | "freeLimits" | "limitations">;
};
```

Each nonempty claim requires 1–6 exact quotes, 12–1,200 characters each, from
`candidate.evidencePages`. Text is capped at 1,200 characters per claim.
The evidence check date comes from `candidate.fetchedAt`, never the model or
screenshot timestamp. The profile survives analysis parsing and is stored in
`tool_sources.raw_json.analysis.profile` with its evidence bundle. The website
reads and validates it directly; no database migration is required.

The import CLI rejects an otherwise publishable basic-only bundle before it
creates a tool or import record. Research gaps can therefore be repaired and
retried without overwriting existing tools. Public user submissions stay hidden
until a researched bundle for their domain passes the same check; see
`docs/catalog-enrichment.md`.

Existing basic-only records do not gain researched detail automatically. Backfill
requires a separate explicit task to research and update those existing tools.
New rendering code must be deployed before publishing the first rich-profile
batch. Keep the local Gate enabled so an older Schedule prompt cannot publish
another basic-only record.

## Server screenshot artifacts

Save the browser screenshot bytes as
`<bundle-directory>/screenshots/<canonicalDomain>.png` (the image decoder accepts
PNG, JPEG or WebP bytes). Alongside it save `<canonicalDomain>.json`:

```json
{
  "sourceUrl": "https://official-product.example/",
  "provider": "cloudflare-browser-rendering",
  "capturedAt": "2026-09-22T12:00:00.000Z",
  "viewport": { "width": 1440, "height": 900 }
}
```

The capture CLI records the actual URL and capture time. Inspect the saved image.
The import CLI checks this metadata, the exact product URL, and a 24-hour
freshness window before creating any tool. It passes the supplied image to the
asset script, which normalizes it to 1440 × 900 WebP without launching Chrome.
`--screenshot-dir=<directory>` can override the default location. Missing images
remain retryable local work. Blocked HTTP sources remain retryable; do not launch a local browser.
The screenshot client uses an isolated Wrangler config with only a remote BROWSER
binding, reusing Wrangler login without binding production D1 or R2. Legacy
ai-publisher images remain accepted for existing batches.
