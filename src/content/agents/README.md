# AI agent pages (/agents)

This folder is the source of the `/agents` section. It moved here from the
former agentsversus repository on 2026-10-09; edit it directly.

- `agents.json`: agent facts. Only official sources fill a field; anything not
  stated officially stays `"unknown"` and renders as "Not stated". Every entry
  lists its `sources`. `checkedOn` is the baseline check date; an entry's own
  `checked_on` overrides it after a per-agent re-check. Unconfirmed
  third-party claims never go in this file (the repository is public).
- `<kind>/<key>.mdx`: pages, where kind is `agents`, `compare`, `pricing`,
  `alternatives`, `best` or `safety`. Each exports `meta` plus an MDX body.
  `overview.mdx` renders at `/agents`, `personal.mdx` at `/agents/personal`.
- `index.ts`: registers every page. A new MDX file needs an entry here.

Internal links use Ordalin paths (`/agents/compare/muse-vs-dots`).
`src/lib/agents/agents.test.ts` validates the facts, the registry and the
links. The templates live in `src/app/agents/`, `src/components/agents/` and
`src/lib/agents/`.
