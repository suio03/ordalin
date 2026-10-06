# Page metadata and indexing

How every public page gets its `<title>`, description, canonical, robots and
share tags, and how to check them. Route-level indexing policy lives in
`MVP_PLAN.md` §3 and §11; editorial completeness in `docs/editorial-standard.md`.

## Where each value comes from

| Value | Source |
| --- | --- |
| `<title>` | The page's `title` plus the layout template `%s · Ordalin`. Pages that need an exact title use `{ absolute: "… \| Ordalin" }` (editorial articles, curated tool profiles). |
| Description | The page's `description`; the layout's sitewide description is only a fallback. |
| Canonical | `alternates.canonical`, a relative path resolved against `metadataBase` (`NEXT_PUBLIC_APP_URL`). Paginated catalogue and category pages keep `?page=N`; filtered views canonicalise to the unfiltered page. |
| Robots | Omitted means indexable. Rules are listed below. |
| `og:*`, `twitter:*` | `withSocial()` in `src/lib/seo.ts` derives them from the page's own title, description and canonical. Share titles carry no `· Ordalin` suffix because Next applies `title.template` to `<title>` only. |
| Share image | Tool pages: the profile screenshot (curated profile first, then the catalogue screenshot from R2), 1440 × 900. Every other page: `public/og-default.png`, 1200 × 630. |

### Tool pages

`generateMetadata` in `src/app/tools/[slug]/page.tsx`:

- **Title:** `toolPageTitle()` in `src/lib/catalog.ts` names the tool by its main use: `AdAnt — AI Ad Creative`. It picks the first category tag, alphabetically, within the primary category group. It falls back to any category tag, then to the group name, and prefixes `AI` unless the label already starts with it.
- **Curated profiles** (`src/content/tool-profiles/`, currently Granola) override the title and description with hand-written copy.
- **Description:** curated profile, else the researched `analysis.profile` overview, else the tagline.

The import quality of `analysis.profile` and screenshots therefore decides how tool pages look in search and when shared. See `docs/catalog-profile-standard.md`.

### Robots rules in code

| Route | Rule |
| --- | --- |
| `/tools` | `noindex` when any filter or query is set |
| `/categories/[group]`, `/categories/[group]/[category]` | Indexable from `indexableCategoryMinimum` (15) published tools |
| `/best`, `/alternatives`, `/compare` hubs | `noindex, follow` until the kind has a published, complete article (`editorialHubMetadata`); the sitemap uses the same condition |
| Editorial articles | Indexable only when published and complete (`editorialMetadata`) |
| `/guides` | `noindex, follow` while no guide is published |
| `/models` | `noindex, follow` below `indexableModelsMinimum` (3) published `ai-model` tools; the sitemap uses the same condition |
| `/search`, `/about/ranking`, `/admin/*` | `noindex` |

`robots.ts` disallows only `/admin/` and `/api/`. `/search` must stay crawlable so crawlers can read its `noindex`.

## Adding or changing a page

1. Give it `title`, `description` and `alternates.canonical`, plus `robots` when it can be thin or empty.
2. Wrap the object in `withSocial()`. Pass a second argument for a page-specific image, or `null` for none.
3. Set `openGraph` fields such as `type: "article"` or `publishedTime` only when needed. Fields the page sets win over derived ones.

A page-level `openGraph` replaces the layout's entirely, which is why `withSocial()` rebuilds the whole object.

Unwrapped routes still inherit the layout's share image and card. They get no `og:title` or `og:url`, so wrap every indexable page.

## Dynamic routes on Workers

Do not set `export const dynamicParams = false` on a route that production must serve. OpenNext here has no incremental cache, so prerendered pages are not found at runtime. With `dynamicParams = false` the request then ends in a 404 (`NoFallbackError`).

Keep `generateStaticParams` if it is useful, and call `notFound()` for unknown slugs in both `generateMetadata` and the page.

## Default share image

`public/og-default.png` is the official Editorial Cut logo (`brand/assets/svg/ordalin-logo-primary.svg`, never redrawn) centred on the light page ground, with the tagline "Find the right AI tool" in text-secondary.

Regenerate it after a logo, tagline or token change:

```bash
pnpm og:default
```

Social platforms cache images per URL. After replacing the file, refresh the preview in each platform's debugger, or rename the file and update `defaultSocialImage`.

## Checking rendered tags

`pnpm seo:check [base] [paths…]` fetches one page per route type. For each it prints robots, canonical, share title and image. It fails when share tags are missing or `og:url` differs from the canonical. It only sends GET requests.

- **Local dev:** `pnpm seo:check` against `pnpm dev`, which reads production D1/R2 read-only when the private config exists.
- **Workers runtime:** run `pnpm exec opennextjs-cloudflare build`, then `pnpm exec wrangler dev --local --port 8790 --persist-to .wrangler/demo`, then `pnpm seo:check http://localhost:8790 <paths>`. Without `--persist-to` the local D1 is empty and catalogue pages return 500. Demo data has fewer tools (for example no Granola, and categories stay `noindex`).
- **After a deploy:** `pnpm seo:check https://ordalin.com`, together with the checks in `AGENTS.md`.

Rendered tags are not search engine state. Indexing, rich results and share previews are confirmed only in Search Console and each platform's debugger.
