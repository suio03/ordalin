# Guides and time-archive contract

Status: MDX guide system implemented; no guide is currently published

Ordalin Guides provide evidence-led decision support around choosing and using
AI tools. They are not a general AI-news feed and must not become bulk-generated
SEO inventory. Guide copy should connect readers to relevant catalogue,
category, collection, or Find by goal pages without inventing product claims.

## Routes and indexing

- `/guides` is the guide index. It remains `noindex, follow` and is omitted from
  the sitemap while no published guides exist. Header and footer entries are
  hidden; restore navigation only when useful content and its release are approved.
- `/guides/[slug]` is a static article route. Only registered guides with
  `status: "published"` receive a route and sitemap entry.
- Drafts and unknown slugs return 404 through `notFound()`. Guides are bundled
  with static imports, so Workers never reads the filesystem. Do not add
  `dynamicParams = false`: without an incremental cache it makes every guide
  404 in production (see `docs/seo.md`).
- Published guides emit canonical metadata, Article Open Graph fields, and
  Schema.org `Article` structured data.

## Authoring a guide

Create `src/content/guides/<slug>.mdx` with an exported metadata object and MDX
body. Use a lowercase kebab-case slug.

```mdx
export const metadata = {
  title: "How to choose an AI transcription tool",
  description: "A factual guide to the tradeoffs that matter.",
  author: "Ordalin",
  publishedAt: "2026-09-01",
  updatedAt: "2026-09-01",
  status: "draft",
  topics: ["Voice & Speech"],
  relatedLinks: [
    { href: "/categories/voice-speech", label: "Voice & Speech tools" },
  ],
};

# How to choose an AI transcription tool

Write the evidence-led guide here.
```

Then add one statically analyzable loader to `guideLoaders` in
`src/lib/guides.ts`:

```ts
"choose-an-ai-transcription-tool": () =>
  import("@/content/guides/choose-an-ai-transcription-tool.mdx"),
```

Keep `status: "draft"` until the copy, links, dates, and factual claims have
been checked. Publishing requires only changing the status and rebuilding; it
does not require D1, an admin CMS, or a migration.

## Time archive reservation

The future catalogue archive will use `/archive/[year]/[month]`. Do not expose
the route or navigation link until enough history exists to make the pages
useful. Archive membership is derived from the existing `tools.published_at`
Unix timestamp, so no new database table or column is required.

Archive copy must say tools were **added to Ordalin** in a given month. It must
not claim that products launched in that month unless a separate verified
product-launch date is introduced later. When implemented, omit empty months,
provide crawlable month navigation, and include only sufficiently populated
archive pages in the sitemap.
