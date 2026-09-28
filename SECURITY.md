# Security policy

Security fixes target the latest code on the default branch. Older snapshots
and independently deployed forks are not maintained as separate release lines.

## Report a vulnerability privately

Use GitHub's **Report a vulnerability** option under this repository's Security
tab when available:
https://github.com/suio03/ordalin/security/advisories/new

If GitHub private reporting is unavailable, ask the maintainer
(https://github.com/suio03) for a private reporting channel. Do not include
exploit details, credentials or personal data in a public issue. There is no
published response-time or bounty commitment.

Include affected routes or files, reproduction steps using your own isolated
instance, and the expected impact. Redact tokens, contact emails and database
contents. Do not test destructive operations against `ordalin.com` or other
people's deployments.

## Deployment boundaries

Production secrets belong in Cloudflare Worker secrets. Keep local secrets in
ignored environment files and deployment bindings in ignored
`wrangler.production.jsonc`. Protect both `/admin/*` and `/api/admin/*` with
Cloudflare Access and configure JWT verification as described in
`docs/environment.md`.

Development read-only guards protect application calls; they do not restrict
the permissions of Wrangler credentials or maintenance commands. Database
exports and submission records must remain private.
