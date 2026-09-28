# Contributing

Ordalin is a search-first directory for discovering and comparing AI tools.
Please discuss substantial product or design changes in an issue before starting
implementation. Small fixes can go straight to a pull request.

## Run locally

Use Node.js 22 and pnpm 10:

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm demo:setup
pnpm dev:demo
```

No Cloudflare login or production credentials are needed. The demo is read-only
and uses `.wrangler/demo`. Submission tests use isolated runtime fixtures;
never test writes against the live directory.

Read `AGENTS.md`, `MVP_PLAN.md` and `docs/design-system.md` before changing product
behavior. Catalogue imports must meet `docs/catalog-profile-standard.md`.
Do not bundle raw crawls or operator research into a pull request.

## Before opening a pull request

```bash
pnpm check:public
pnpm lint
pnpm typecheck
pnpm test
pnpm test:submissions:runtime
pnpm build
```

Explain the problem, resulting behavior and relevant validation. Include a
screenshot for visible UI changes. Keep changes focused and avoid unrelated
formatting or generated-file churn. Contributions should be compatible with the
license and preserve third-party notices.

## Keep private data private

Never commit secrets, populated environment files, production configuration,
local databases, backups, user submissions or raw research bundles. Git ignores
common local artifacts, but review `git diff --cached` before committing.
Do not use `git add -f` to bypass those exclusions.

Deployment instructions are in `docs/environment.md`. You need your own
Cloudflare resources to deploy a fork. Remote maintenance commands are operator
tools, not part of the contributor quick start.

Report vulnerabilities privately as described in `SECURITY.md`.
