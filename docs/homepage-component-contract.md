# Homepage component contract

Status: approved implementation contract for Phase B
Design source: `docs/design-system.md`
Product source: `MVP_PLAN.md`

This contract turns the approved Navigation Radar homepage into component and
data boundaries. It does not authorize prototype counts, picks, collections, or
publication status as production facts.

## Server composition

`src/app/page.tsx` remains a Server Component. It starts independent catalogue,
category, collection, and editor-pick reads together and passes complete card
projections into interactive client islands. Cards must never issue their own D1
queries.

```text
RootLayout
├── SiteHeader
├── HomePage (server data composition)
│   └── DirectoryExplorer (client interaction island)
│       ├── PromiseSearch
│       ├── CategoryStrip
│       └── NavigationRadar
│           ├── CategoryRail
│           ├── CataloguePanel
│           │   ├── CatalogueFilters
│           │   ├── DateAddedSort
│           │   ├── Pagination
│           │   └── ToolRow list
│           └── EditorialSidecar
│               ├── CollectionShortcuts
│               ├── EditorPicks
│               └── RankingDisclosure
└── SiteFooter
```

At 820 px and below, visual CSS order must match the approved compact order:
search, horizontal categories, catalogue filters and results, collections, Editor Picks, then
ranking/disclosure. The DOM order must stay meaningful without CSS.

## Read models

```ts
type ToolCard = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  websiteUrl: string;
  sourceProvider: string | null;
  canonicalDomain: string;
  primaryCategory: { slug: string; name: string };
  pricingModel: string;
  logoAssetKey: string | null;
  publishedAt: number;
  lastCheckedAt: number | null;
  isEditorPick: boolean;
  tags: string[];
};

type CategorySummary = {
  slug: string;
  name: string;
  description: string;
  publishedToolCount: number;
};

type CollectionSummary = {
  slug: string;
  name: string;
  description: string;
  publishedToolCount: number;
};
```

`websiteUrl` remains the clean stored product URL. `ToolRow` derives the public
Visit target and relationship from it at render time using the outbound-link
policy in `docs/catalog-enrichment.md`; callers must not pre-append UTM values.

All reads enforce published tool status. Counts come from D1 and may not be
copied from the design prototype. The homepage category rail omits category and
all-tool counts; the catalogue result count reflects the active server query.

## Interaction ownership

- The homepage URL owns query, category, pricing, date-added sort, and page state.
  `/search` separately owns query, category, pricing, tag, and page.
- The homepage defaults to newest-first order; category, pricing, and query default
  to all, all, and empty.
- Filters and pagination query D1 on the server and remain shareable through the URL.
- Submitting the homepage search filters the homepage catalogue. `/search` remains
  available for its expanded category, interface, and attribute filters and is
  always `noindex, follow`.
- Reset restores defaults and returns focus to the search input.
- Homepage and `/search` pagination use crawlable links; infinite scroll is never
  the only path. Legacy `/new` permanently redirects to `/`.
- `/` focuses search unless another text input is active; Escape clears and
  blurs the focused search input.

## States and accessibility

Ready, focused, narrowed, empty, and reset states are required. Result count
uses `aria-live="polite"`. Active controls expose `aria-pressed` and use text or
shape in addition to color. Focus uses the blue semantic focus token. Compact
targets are at least 44 by 44 px, and reduced motion removes translation.
