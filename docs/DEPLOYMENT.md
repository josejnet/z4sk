# Deployment

## Production resources

- Vercel project: `josejcoy-9481s-projects/z4sk`
- GitHub repository: `josejnet/z4sk`
- database: Vercel-managed Neon Postgres
- required secrets: `DATABASE_URL`, `FOUNDER_DASHBOARD_KEY`, `CRON_SECRET`, `RATE_LIMIT_HMAC_SECRET`
- required public-launch disclosure: `LEGAL_ENTITY_NAME`, `LEGAL_POSTAL_ADDRESS`, `PRIVACY_EMAIL`, verified `NEON_RESTORE_WINDOW_HOURS`
- retention trigger: `0 3 * * *` (daily at 03:00 UTC on the Hobby plan)

Secrets stay in Vercel environment variables and must never enter Git or logs.

## First-time setup

```bash
npm ci
vercel link --yes --project z4sk
vercel env pull .env.local --yes
npm run build
vercel --prod
```

Use Node.js 22.13 or newer.

## Routine release

1. Confirm `git status` is clean and review the intended commit.
2. Run `npm run lint`, `npm run build` and `npm audit --omit=dev`.
3. Push the reviewed commit to `main`; Vercel deploys it automatically.
4. Verify the homepage, create/respond/read flow and founder metrics.
5. Verify `/api/privacy-proof` reports zero expired responses, the single-use unique index, HMAC configuration, operator contact and the exact Neon restore window.

## Rollback

```bash
vercel ls
vercel rollback
```

Application rollback does not reverse a database migration. Database changes must be backwards-compatible.

## Secret rotation

Use `vercel env add FOUNDER_DASHBOARD_KEY production --force --sensitive`, then redeploy. Verify the old key returns `403` and the new key returns `200` from `/api/founder/metrics`.

Rotate `RATE_LIMIT_HMAC_SECRET` independently with at least 32 random bytes. Rotation invalidates only short-lived rate-limit pseudonyms; it does not affect creator links or encrypted responses.
