# Public repository preparation

## Distribution boundaries

The public tree contains application code, migrations, catalogue fixtures,
design documentation, contribution guidance and a local demo configuration.
MIT is the selected code license. See `NOTICE.md` for project identity and
third-party material.

Keep these outside Git and outside source archives:

- Populated `.env*` and `.dev.vars*` files (only the example files are public).
- `wrangler.production.jsonc`, API tokens, private keys and credential exports.
- `.wrangler/`, `.ordalin-imports/`, `.next/`, `.open-next/` and `node_modules/`.
- Database snapshots, backups, operational logs and submission/contact records.

The public `wrangler.jsonc` has no production D1 ID, Access team domain or
production route. Its D1/R2 bindings are local. A maintainer's existing private
configuration is preserved separately; remote commands select it explicitly.
Public analytics identifiers in application code are not access credentials;
tracking remains restricted to the official production hostnames.

## Verification

```bash
pnpm install --frozen-lockfile
pnpm check:public --history
pnpm demo:setup
pnpm lint
pnpm typecheck
pnpm test
pnpm test:submissions:runtime
pnpm build
pnpm dev:demo
```

Confirm that the homepage, search and submission notice render from the demo,
and that a local submission POST returns 403. The setup uses `.wrangler/demo`
and must never be redirected to production.

`check:public` scans tracked and non-ignored new files for private artifact paths
and known credential formats. `--history` also checks all locally reachable Git
file versions. It reports locations, not secret values. It does not detect every
possible credential, inspect remote-only refs, validate asset permissions or
replace manual review. Binary files are checked by path only.

## History decision

The maintainer selected MIT and replaced the private development history with a
single initial public commit before publication. Earlier commits contained
production resource identifiers and a personal commit email; they are not part
of the public repository. Commits use the maintainer's GitHub noreply address.

Before the reset, the private history was audited (27 commits, 446 historical
file versions) with no actual credentials identified by the checks used. These
findings are a point-in-time review, not a security guarantee for later changes.

## GitHub and deployment

- The repository is public. CI runs verification only with read-only
  repository permissions; it does not deploy.
- Production deploys run locally with `pnpm run deploy`, which reads the ignored
  `wrangler.production.jsonc`. Cloudflare Workers Builds is not connected: a
  clean checkout deliberately has no production configuration, and building it
  would fall back to the local demo configuration.
- GitHub private vulnerability reporting, secret scanning and push protection
  are enabled.

Configuration references:
[Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/),
[D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/).
