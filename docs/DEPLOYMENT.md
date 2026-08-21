# Deployment

## Production resources

- Cloudflare Worker: `z4sk`
- D1 binding: `DB`
- D1 database: `z4sk-db`
- temporary URL: `https://z4sk.z4sk-app.workers.dev`
- required secret: `FOUNDER_DASHBOARD_KEY`
- retention trigger: `* * * * *` (every minute, UTC)

Cloudflare account identifiers in `wrangler.jsonc` route deployments but are not authentication credentials. OAuth tokens and secret values must stay outside Git.

## First-time setup

```bash
npm ci
npx wrangler login
npx wrangler d1 migrations apply z4sk-db --remote
npx wrangler secret put FOUNDER_DASHBOARD_KEY
npm run deploy:cloudflare
```

Use Node.js 22.13 or newer. Do not put the founder key in `.env`, command history, issue text or Actions logs.

## Routine release

1. Confirm `git status` is clean and review the intended commit.
2. Run `npm run lint`, `npm test` and `npm audit --omit=dev`.
3. If the schema changed, generate and inspect a migration, then apply it remotely before code that depends on it.
4. Run `npm run deploy:cloudflare`.
5. Verify the homepage, create/respond/read flow and founder metrics.
6. Verify `/api/privacy-proof` reports a current purge heartbeat and zero expired responses.
7. Tag meaningful production releases after verification.

## Custom domain

Buy the selected Z4SK domain through the owning company account, add it to Cloudflare and configure it as a Worker custom domain. Keep the `workers.dev` address as a diagnostic fallback, but use the branded HTTPS origin in public shares, metadata and SDK examples.

## Rollback

List deployments and select the last known-good version:

```bash
npx wrangler deployments list
npx wrangler rollback
```

Application rollback does not reverse a D1 migration. Database changes must be backwards-compatible, and any destructive data migration needs its own tested recovery plan.

## Secret rotation

```bash
npx wrangler secret put FOUNDER_DASHBOARD_KEY
```

After rotation, verify `/api/founder/metrics` returns `403` for the old value and `200` for the new value. Creator tokens cannot currently be rotated; deleting and recreating the invitation is the recovery mechanism.
