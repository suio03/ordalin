# Multilingual free tools (i18n)

Approved by the maintainer on 2026-11-12 (option A). Only free tools are multilingual. Every other page on Ordalin stays English only.

Conventions follow saybrush and tapemoon (`../saybrush/docs/i18n/README.md`, `../tapemoon/docs/i18n/README.md`), adapted to Next.js. There is one difference: **each page chooses which locales it is published in**, instead of every localized page being published in every locale.

## Locales

| Code | Language | og:locale | Status |
|---|---|---|---|
| en | English (default, unprefixed) | en_US | Live |
| ja | 日本語 | ja_JP | First wave |
| es | Español | es_ES | First wave |
| id | Bahasa Indonesia | id_ID | First wave |
| de | Deutsch | de_DE | Later |

- New locales are added only when two or three tools have demand in them. One tool on its own is not enough.
- Locale research: [free-tools-localization-2026-11-12.md](../keywords/free-tools-localization-2026-11-12.md).

## Which pages are published in which locales

| Page | Locales | Reason |
|---|---|---|
| /free-tools/circle-crop-image | en, ja, es, id | JP variations total 10.5K; ES 4.3K + 1.8K global; ID variations total 1.7K |
| /free-tools/square-an-image | en, ja (de later) | JP variations total 4.5K, KD 11–16. ES and ID intent is unclear or polluted by other intents |

A locale is added to a page only after `lyl-keyword-localizer` finds demand for it. Pages are never machine-translated to fill in locales.

## URL and SEO rules

- **URL shape:** English has no prefix (`/free-tools/circle-crop-image`). Other locales are prefixed (`/ja/free-tools/circle-crop-image`). Slugs stay in English.
- **Redirects:** `/en/…` returns a 301 to the unprefixed URL. Any locale/page pair that is not in the table returns a 404.
- **Per-locale tags:** canonical points to the page's own locale. `<html lang>`, `og:locale` and JSON-LD `inLanguage` match it.
- **hreflang:** lists only the locales this page actually has, plus `x-default` pointing to English. The same alternates go in the sitemap.
- **Language switching:** links to the same page in its other locales. No automatic redirect by IP or browser language.
- **Localized hub pages:** a locale gets a hub (`/ja/free-tools`) only once it has two or more tools; it lists only the tools in that locale. With one tool (es, id today) the page links to the English hub instead.

## Copy

- **Where copy lives:** one file per tool per locale. English defines the type, so a missing or extra key fails `tsc`.
- **Shared strings:** the tool UI (upload, download, controls, errors) and the localized page frame (breadcrumb, switcher, footer links) are written once per locale.
- **Writing:** title, H1 and body copy are written for each locale's own search terms (table below). They are not line-by-line translations of the English page.

| | circle crop | square |
|---|---|---|
| ja | 画像 を 丸く 切り抜く (twin: 画像 丸く 切り取る) | 画像 を 正方形 に する (画像 正方形) |
| es | recortar imagen en círculo (recortar foto en círculo) | — |
| id | crop foto bulat (crop foto jadi bulat) | — |
| de | — | bild quadratisch machen (later) |

## How it works (built 2026-11-12)

- **Two root layouts.** `src/app/(site)/layout.tsx` (English, every existing page) and `src/app/(i18n)/[locale]/layout.tsx` (ja/es/id) both render `RootDocument` from `src/components/root-document.tsx`, so `<html lang>` matches without making pages dynamic. `src/app/(site)/[...missing]` keeps unmatched URLs on the site 404.
- **Config:** `src/lib/free-tools/i18n.ts` holds the locales, `toolLocales` (which page in which locale), `localizePath` and the hreflang builder. Adding a locale to a page = add it to `toolLocales`, add the copy, done; routes, hreflang and sitemap follow.
- **Copy:** page copy `src/lib/free-tools/image-shape/{circle,square}-page.<locale>.ts` (typed by `ToolPageCopy`), registered in `pages.ts`; tool UI strings in `ui-copy.ts` (typed by English `copy.ts`); localized hub strings in `localizedHubs` (`pages.ts`).
- **Routes:** `src/app/(i18n)/[locale]/free-tools/<slug>/page.tsx` with `generateStaticParams` from `toolLocales` and `dynamicParams = false`, so other pairs 404. `/en/free-tools/…` permanently redirects in `next.config.ts`.
- **Switcher:** `ToolPage` lists the page's own locales under the subtitle. The site header and footer stay English.
