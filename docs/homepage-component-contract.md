# Homepage component contract

Status: approved implementation contract for Phase B
Design source: `docs/design-system.md`
Product source: `MVP_PLAN.md`

This contract turns the approved homepage sidebar and shelves and `/tools` Navigation Radar into component and
data boundaries. It does not authorize prototype counts, picks, collections, or
publication status as production facts.

## Server composition

`src/app/page.tsx` is a Server Component that composes a category sidebar and
shelves. It starts independent category, newest-tool, task, collection and
live-editorial reads together, then one `listPublishedTools({ categorySlug,
pageSize: 4, featuredFirst: true })` read per category group. Cards never issue
their own D1 queries. The homepage has no client island; search is a plain GET
form to `/tools`.

```text
RootLayout
├── SiteHeader            (All tools · Best of · Compare · Find by goal · Collections;
│                          MobileMenu disclosure at 820 px and below)
├── HomePage
│   ├── Promise + search  (GET /tools?q=)
│   └── Layout
│       ├── Sidebar       (sticky raised panel: All tools + groups with counts → /categories/[group];
│       │                  Browse: Find by goal, Collections, Best-of lists, Comparisons)
│       └── Content
│           ├── EditorialShelf  (up to three live best/alternatives/compare cards; hidden when empty)
│           ├── NewestShelf     (four tools)
│           └── GroupShelf × N  (four tools, editor picks first; group link; best-of link when live)
└── SiteFooter            (Browse · Best of · Compare · Ordalin)
```

DOM order equals the mobile order: search, horizontal category pills (the
sidebar collapses into a scroller without counts or Browse links), editorial
shortlists, newest tools, group shelves. Legacy catalogue query URLs on `/`
permanently redirect to `/tools` with the same parameters.

The full catalogue moved to `/tools` (`src/app/tools/page.tsx`) and keeps the
Navigation Radar composition:

```text
ToolsPage (server data composition)
└── DirectoryExplorer basePath="/tools" (client interaction island)
    ├── PromiseSearch
    ├── CategoryStrip
    └── NavigationRadar
        ├── CategoryRail
        ├── CataloguePanel (filters, date-added sort, pagination, ToolRow list)
        └── EditorialSidecar (collections, editor picks)
```

At 820 px and below, `/tools` keeps the compact order: search, horizontal
categories, catalogue filters and results, collections, Editor Picks. The DOM
order must stay meaningful without CSS.

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
copied from the design prototype. The homepage sidebar shows published counts
per group; the `/tools` category rail omits category and all-tool counts; the catalogue result count reflects the active server query.

## Interaction ownership

- The `/tools` URL owns query, category, pricing, date-added sort, and page state.
  `/search` separately owns query, category, pricing, tag, and page.
- `/tools` defaults to newest-first order; category, pricing, and query default
  to all, all, and empty.
- Filters and pagination query D1 on the server and remain shareable through the URL.
- Submitting the homepage search opens `/tools?q=`; submitting the `/tools` search filters it in place. `/search` remains
  available for its expanded category, interface, and attribute filters and is
  always `noindex, follow`.
- Reset restores defaults and returns focus to the search input.
- `/tools` and `/search` pagination use crawlable links; infinite scroll is never
  the only path. Legacy `/new` permanently redirects to `/tools`.
- On `/tools`, `/` focuses search unless another text input is active; Escape clears and
  blurs the focused search input.

## States and accessibility

Ready, focused, narrowed, empty, and reset states are required. Result count
uses `aria-live="polite"`. Active controls expose `aria-pressed` and use text or
shape in addition to color. Focus uses the blue semantic focus token. Compact
targets are at least 44 by 44 px, and reduced motion removes translation.
