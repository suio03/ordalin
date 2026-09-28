# Ordalin design system

Status: approved 23 August 2026
Product theme: **Quiet Radar**
Logo system: **Editorial Cut**
Platform: desktop-first responsive web product
Appearance: System, Light, and Dark; System is the default

This document is the durable visual and interaction specification for Ordalin. If an exploration artifact conflicts with this document, follow this document and the semantic token files beside it.

## 1. Product expression

Ordalin makes a large AI-tool inventory feel navigable, factual, and intentionally edited. The experience should feel:

- calm rather than promotional;
- precise without looking like an internal database;
- editorial without imitating a magazine;
- lightly spatial without using literal radar imagery;
- current without relying on temporary AI visual conventions.

The defining idea is **quiet orientation**: users should understand where they are, what is current, and how to narrow the catalogue without visual noise.

## 2. Non-negotiable principles

1. **Search-first, not search-only.** Search anchors the homepage, but useful tools appear before the user types.
2. **Inventory over theatre.** Tool purpose, category, pricing, freshness, and Visit matter more than hero decoration.
3. **Truth is visible.** Show source and check dates where useful. Never invent ratings, saves, usage, trends, popularity, or sponsorship.
4. **Green has meaning.** Use it only for active selection, freshness, verified-positive feedback, or a successful state.
5. **Depth stays solid.** Build hierarchy with surface color, borders, spacing, and restrained shadows—not blur-heavy glass.
6. **Calm still needs contrast.** Atmospheric color may never weaken text, focus, state, or panel boundaries.
7. **The logo remains itself.** Use the charcoal treatment on light surfaces and
   the approved white treatment on dark surfaces. Do not introduce other logo
   colors, retype the wordmark, or alter its shape.

## 3. Authoritative artifacts

| Purpose | File |
| --- | --- |
| Platform-neutral token source | `tokens.json` |
| Web CSS adapter | `design-tokens.css` |
| Approved responsive homepage | `../design-exploration/round-02/quiet-radar.html` |
| Desktop/mobile review board | `../design-exploration/round-02/review.html` |
| Logo rules and assets | `../brand/BRAND_GUIDELINES.md` |
| Product scope and homepage contract | `../MVP_PLAN.md` |

## 4. Color system

### Core roles

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `surfacePrimary` | `#EDF3F1` | `#101714` | Page ground; never a card accent. |
| `surfaceRaised` | `#F8FBFA` | `#171F1C` | Search, panels, prominent controls. |
| `surfaceMuted` | `#E1EAE7` | `#202A26` | Selected tabs, tool marks, quiet grouping. |
| `surfaceAccent` | `#D7E5E1` | `#293630` | Collection fields and category context. |
| `surfaceInput` | `#FFFFFF` | `#111916` | Form fields and selected controls. |
| `textPrimary` | `#14201D` | `#EEF5F2` | Primary copy, headings, important icons. |
| `textSecondary` | `#56645F` | `#B3C0BB` | Supporting descriptions and inactive controls. |
| `textTertiary` | `#65726D` | `#8F9D98` | Metadata only; do not use below 10 px. |
| `textOnStrong` | `#FFFFFF` | `#101714` | Text on inverted primary controls. |
| `borderSubtle` | `#14201D24` | `#EAF4F01F` | Dividers and ordinary panel boundaries. |
| `borderStrong` | `#14201D47` | `#EAF4F03D` | Emphasized boundaries. |
| `accentPrimary` | `#147754` | `#5BC095` | Active, freshness, verified-positive state. |
| `accentSoft` | `#D9EEE6` | `#193C2F` | Positive-state background. |
| `accentText` | `#2F5549` | `#98DDBE` | Text paired with `accentSoft`. |
| `focusRing` | `#1F60D3` | `#78A9FF` | Keyboard focus only; never replaced by green. |
| `danger` | `#A63F32` | `#EF8D7F` | Destructive or error state only. |
| `logoCharcoal` | `#111111` | `#FFFFFF` | Approved primary or reversed logo treatment. |

Measured WCAG contrast on the principal surfaces:

- `textPrimary` on `surfacePrimary`: 14.90:1.
- `textSecondary` on `surfaceRaised`: 5.96:1.
- `textTertiary` on `surfaceRaised`: 4.82:1.
- `accentPrimary` on `surfaceRaised`: 5.31:1.
- white on `accentPrimary`: 5.53:1.
- `focusRing` on `surfaceRaised`: 5.49:1.

Measured dark-mode contrast on the principal surfaces:

- `textPrimary` on `surfacePrimary`: 16.44:1.
- `textSecondary` on `surfaceRaised`: 8.95:1.
- `textTertiary` on `surfaceRaised`: 5.96:1.
- `accentPrimary` on `surfaceRaised`: 7.54:1.
- `textOnStrong` on `textPrimary`: 16.44:1.
- `focusRing` on `surfaceRaised`: 7.14:1.

Large atmospheric fields may use low-opacity mineral blue, but they are decorative backgrounds only. Never place text directly on an uncontrolled gradient stop.

### Appearance behavior

- The header exposes one compact appearance control with System, Light, and
  Dark choices.
- First visits default to System. An explicit choice is stored locally and
  restored on later visits.
- Resolve and apply the theme before first paint to avoid a light flash or
  hydration mismatch.
- The browser color scheme and theme color must follow the resolved mode.
- Dark mode translates Quiet Radar into ink and mineral surfaces; it does not
  introduce glow, decorative green, glass, gradients, or new component shapes.

## 5. Typography

Use local system fonts to keep the product fast and neutral:

- Interface: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Metadata: `ui-monospace, SFMono-Regular, Menlo, monospace`.
- Do not introduce a separate display font into the application without a new decision.

| Role | Desktop | Compact | Weight | Guidance |
| --- | --- | --- | --- | --- |
| Homepage promise | 61/60 px | 39/39 px | 520 | Tracking `-0.058em`; maximum two lines. |
| Section heading | 23/28 px | 21/26 px | 580 | Short, factual labels. |
| Panel heading | 15/19 px | 15/19 px | 640 | Sentence case. |
| Tool name | 14/19 px | 14/19 px | 650 | Never truncate the name. |
| Body | 15/23 px | 13/20 px | 400 | Maximum comfortable line length 65 characters. |
| Tool purpose | 11/16 px | 11/16 px | 400 | One line desktop; may wrap compact. |
| Control | 11/16 px | 11/16 px | 500–600 | Clear verbs and nouns. |
| Metadata | 10/14 px | 10/14 px | 600 mono | Uppercase only for short labels. |

Do not use metadata typography for paragraphs. Support browser text zoom to 200% without hiding actions or requiring horizontal page scrolling.

## 6. Spacing and layout

Use the 4 px base scale from `tokens.json`. Default steps are 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, and 80 px.

### Desktop reference

- Reference viewport: 1440 × 900.
- Maximum content width: 1312 px.
- Page gutter: 28 px per side minimum.
- Primary radar field: 205 px category rail, flexible feed, 292 px editorial rail, 16 px gaps.
- Hero remains compact: navigation, promise/search, categories, and inventory entry appear in the first viewport.
- The full page exposes at least 10–12 useful tools without requiring search.

### Breakpoints

| Name | Threshold | Required transformation |
| --- | --- | --- |
| `wide` | above 1080 px | Three-zone radar field. |
| `medium` | 821–1080 px | Tighter rails; secondary navigation may reduce. |
| `compact` | 561–820 px | One-column catalogue; category rail removed; two-column sidecar. |
| `small` | 560 px and below | 390 px reference behavior; single-column sidecar and expanded touch targets. |

### Approved compact order

1. Brand navigation and Submit.
2. Promise and search.
3. Horizontally scrollable top categories.
4. Catalogue filters, date-added sort, and pagination.
5. Collections.
6. Editor Picks.
7. Ranking and disclosure shortcut.

Do not simply shrink the desktop three-column grid.

## 7. Shape, borders, and elevation

- Small control radius: 9–10 px.
- Search and tool-mark radius: 13–15 px.
- Panel radius: 20 px.
- Hero radius: 24 px.
- Radar-field radius: 28 px.
- Pills: fully rounded only for categories, tabs, status, and concise actions.
- Ordinary border: 1 px `borderSubtle`.
- Strong border: 1 px `borderStrong`.
- Use `shadowSoft` only on raised hero/search/panels. Never stack multiple prominent shadows.
- Translucency is optional. Every surface must remain correct as an opaque solid color.

## 8. Logo, icons, and imagery

### Logo

- Use `brand/assets/svg/ordalin-logo-primary.svg` on light surfaces.
- Full lockup minimum width: 120 px; preferred header width: 146 px desktop and 118–126 px compact.
- Use the standalone symbol at 16–64 px when the full wordmark does not fit.
- Follow all clear-space and misuse rules in `brand/BRAND_GUIDELINES.md`.

### Tool marks

- Prefer the reviewed product logo when provenance and usage are valid.
- Fallback is a deterministic two-letter mark on `surfaceMuted`.
- Default size: 40 × 40 px desktop, 38 × 38 px compact.
- Do not recolor third-party logos to match Ordalin.

### Interface icons

- Use simple 1.75–2 px outline icons.
- Icons support text; they do not replace unfamiliar actions.
- Avoid sparkles, magic wands, robots, neural nets, glowing stars, and literal radar sweeps.

### Imagery

The homepage does not require decorative photography or generated illustration. Tool screenshots belong on detail pages and must retain their own visual appearance independent of the application theme.

## 9. Component rules

### Tool profiles

- Use source-aware provenance language: reviewed for manual catalogue work,
  website-checked for Toolify/Product Hunt imports, and submitted for public
  submissions.
- Keep the overview ledger to pricing, availability, and primary group. Show
  freshness once beside the identity and keep source/domain in the facts panel.
- Place the website preview directly below `What it does` in the primary detail
  column, before any published task-specific decision notes. Omit decision notes
  when no real task mapping exists.
- Keep the 1440 × 900 preview at its native 8:5 composition and preserve the
  third-party site's original appearance.

### Global navigation

- Logo left, product navigation center/right, Submit as persistent secondary action.
- Do not make Submit visually stronger than search or the catalogue.
- On compact screens, retain logo and Submit; collapse nonessential navigation.

### Promise and search

- Promise: “Find the right AI tool, without the noise.”
- Search must have a visible label for assistive technology, clear placeholder, and strong focus ring.
- `/` focuses search when another text input is not active.
- Escape clears a focused query and removes focus.

### Categories

- Show active, populated category groups from the approved thirteen-group taxonomy.
- Keep the inactive `Other` fallback and empty groups out of public navigation.
- Desktop may repeat them in the side rail for orientation.
- Compact uses only the horizontal category strip.
- Keep desktop rail labels left-aligned on one line and ellipsize only when the
  available rail width cannot contain the full label.
- Do not show inventory counts in the homepage category rail.
- Active category uses `accentSoft` plus dark text; never color alone in the side rail—include a dot or equivalent shape cue.

### Catalogue filters and sorting

- Date added is deterministic and defaults to newest first, with an oldest-first option.
- Never substitute Trending, Most Saved, or Most Used until the product has valid first-party evidence and an approved ranking rule.
- Category, pricing, query, sort, and page remain URL-addressable.
- Reset restores All categories, Any pricing, newest-first order, clears search, and returns focus to search.

### Tool row

Required content:

- tool logo or deterministic fallback;
- name;
- factual one-sentence purpose;
- primary category;
- pricing model;
- checked/freshness metadata;
- Visit action.

The whole row may be a link, but Visit remains visibly labelled. Desktop rows are at least 82 px high; compact rows are at least 112 px and may wrap the purpose.

### Editor Picks and Collections

- Editor Picks must be explicitly editorial and never presented as popularity.
- Collections are alternate workflow-based entry points, not promotional banners.
- Prototype selections and counts must not ship as facts without editorial review.

### Find by goal

- Present the internal Task model to visitors as **Find by goal**.
- Ask what the visitor wants to accomplish; avoid unexplained product jargon.
- Lead each goal page with three concrete user situations before detailed tool
  comparisons.
- Phrase the first choice as `Choose [tool] if …`; do not imply a universal
  winner or invent a ranking.

### Pagination

- Pagination is URL-addressable in production.
- Do not use infinite scroll as the only catalogue path.
- Current page uses both `aria-current` and a high-contrast shape change.

## 10. Primary interaction contract

The homepage’s primary interaction is **search and narrow**:

| State | Required behavior |
| --- | --- |
| Ready | Inventory visible in newest-first order with the result count announced. |
| Focused | 3 px blue focus ring; no layout shift. |
| Narrowed | Query, category, pricing, and date-added order update server-rendered rows and count. |
| Empty | Explicit “No tools found” message with a useful recovery instruction. |
| Reset | Restore All/All pricing, clear query, update count, return focus to search. |

State feedback begins within 120 ms. Use the 180 ms standard transition only for color, background, and a maximum 3 px row shift. Never animate the result list with vestibular or staggered entrance effects.

Reduced-motion mode removes smooth scrolling and translation while retaining color, border, count, and message feedback.

## 11. Accessibility

- Target WCAG 2.2 AA.
- All interactive elements require visible keyboard focus using `focusRing`; do not rely on browser-default outlines alone.
- Preserve semantic headings, landmarks, labels, reading order, and `aria-live="polite"` for result count.
- Minimum compact touch target: 44 × 44 px.
- Desktop pointer controls may be 38 px high when separated and clearly labelled.
- Never use green, freshness dots, or surface color as the only state cue.
- Support 200% text zoom, `prefers-reduced-motion`, and `prefers-contrast: more`.
- Opaque surface fallbacks are mandatory; meaning cannot depend on transparency.
- Tool purpose may truncate on desktop only when the full value remains available on the destination/detail page. It wraps on compact screens.

## 12. Motion

| Token | Duration | Use |
| --- | --- | --- |
| `motionFast` | 120 ms | Press, focus-adjacent state, count update. |
| `motionStandard` | 180 ms | Hover background and small anchored row shift. |
| `motionSlow` | 260 ms | Rare panel expansion after user action. |

Use the standard easing `cubic-bezier(.2,.7,.2,1)`. Motion communicates state or origin; it is never ambient decoration.

## 13. Do / don’t

### Do

- Start with the semantic tokens.
- Keep the first viewport inventory-rich.
- Use short factual copy and explicit source/freshness labels.
- Preserve the approved desktop and compact hierarchy.
- Test keyboard, touch, text zoom, contrast, empty state, and reduced motion.

### Don’t

- Create one-off dark overrides outside the semantic token adapter.
- Mix in Editorial Index, Signal Desk, or Open Atlas styling.
- Use generic AI gradients, glow, sparkles, robot imagery, or a literal radar.
- Turn every surface into a floating rounded card.
- Use blur as the primary material.
- Invent ratings, review counts, saves, usage, trends, rankings, or sponsorship.
- Recolor, outline, shadow, rotate, or retype the Ordalin logo.

## 14. Reference attribution

The design research is documented in `../design-exploration/research.md`. Quiet Radar combines principles observed in Cosmos (search and provenance), Are.na (intentional discovery), and Linear (disciplined state hierarchy) without copying their signature layouts, icons, imagery, or brand systems. Direct-peer and interaction research included Futurepedia, Toolify, Product Hunt, AlternativeTo, G2, Raindrop.io, and Monocle.
