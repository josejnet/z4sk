# Deployment

[Versión en español](DEPLOYMENT.es.md)

## Production architecture

- Vercel project: `josejcoy-9481s-projects/z4sk`
- GitHub repository: `josejnet/z4sk`
- database: Vercel-managed Neon Postgres
- runtime database role: DML-only access to application tables
- migration database role: schema-owner credential held only by GitHub Actions
- retention trigger: `0 3 * * *` (daily at 03:00 UTC)

Vercel Production requires `DATABASE_URL`, `FOUNDER_DASHBOARD_KEY`, `CRON_SECRET`, `RATE_LIMIT_HMAC_SECRET`, `OPERATOR_NAME`, `PRIVACY_EMAIL`, and the verified `NEON_RESTORE_WINDOW_HOURS`. Preview and Development use the isolated `z4sk_staging_e2e` database and their own HMAC secret.

GitHub Actions requires these repository secrets:

- `Z4SK_STAGING_DATABASE_URL`: restricted connection to `z4sk_staging_e2e`
- `Z4SK_STAGING_HMAC_SECRET`: non-production HMAC secret
- `Z4SK_PRODUCTION_MIGRATION_DATABASE_URL`: production schema-owner connection
- `VERCEL_DEPLOY_HOOK_URL`: Deploy Hook scoped to `main`

Secrets must never enter Git, logs, build output, or client-side environment variables.

## Local setup

Use Node.js 24:

```bash
npm ci
vercel link --yes --project z4sk
vercel env pull .env.local --yes --environment=development
npm run db:migrate
npm run lint
npm test
```

The pulled development URL must point to `z4sk_staging_e2e`, never to production.

## Release pipeline

Automatic Vercel Git deployments are disabled. Every push to `main` runs `.github/workflows/ci.yml`:

1. install from the lockfile on pinned Node and Action versions;
2. lint, build, rendered-output tests, and a full dependency audit;
3. encrypted end-to-end verification against the isolated staging database;
4. versioned production migrations with the schema-owner credential;
5. the `main` Deploy Hook only after every previous step succeeds.

The GitHub `Production` environment requires an explicit approval before the migration/deploy job can start. Only the protected `main` branch may use that environment.

To rerun the same pipeline manually:

```bash
gh workflow run ci.yml --ref main
```

Do not run production migrations with Vercel's runtime `DATABASE_URL`; that role is deliberately unable to change the schema.

## Post-deploy checks

- confirm the production deployment is `READY` and assigned to `https://z4sk.vercel.app`;
- check the homepage CSP contains a per-request nonce and no `unsafe-inline` script permission;
- confirm `Reporting-Endpoints`, enforced CSP reporting and the report-only Trusted Types policy are present;
- compare `deployment.commitSha` from `/api/privacy-proof` with the public GitHub commit and Vercel deployment metadata;
- create, answer, decrypt, and delete a disposable invitation;
- check `/api/privacy-proof` and the daily retention heartbeat;
- inspect production errors without printing request bodies or secrets.

## Rollback

```bash
vercel ls z4sk
vercel rollback
```

Application rollback does not reverse database migrations. Migrations must remain backwards-compatible with the previous deployed version.

## Secret rotation

Rotate Vercel runtime secrets with `vercel env add ... --sensitive`, then release through the verified pipeline. Rotate the GitHub migration credential and Deploy Hook URL in GitHub, not in Vercel runtime variables.

Changing `RATE_LIMIT_HMAC_SECRET` invalidates only pseudonymous rate-limit and reporter identifiers; it does not affect creator links or encrypted responses. Verify the old founder key returns `403` and the replacement returns `200` from `/api/founder/metrics`.

## Repository protection

The public repository protects `main` with the required `verify` check, an up-to-date branch, one pull-request approval, code-owner review, stale-review dismissal, conversation resolution, linear history, and force-push/deletion denial. The repository owner retains GitHub's administrator bypass for emergency recovery; this is a documented single-maintainer trust boundary, not independent review. Signed commits remain unenforced until the owner registers and safely backs up a signing key.
