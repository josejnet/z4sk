# Security policy

## Reporting a vulnerability

This is a private pre-launch repository. Report vulnerabilities privately to the repository owner; do not open a public issue or include private invitation URLs, answer text, credentials or personal data in GitHub.

## Security model

- creator dashboard URLs are bearer secrets; anyone possessing one can read that invitation’s responses
- creator tokens are generated with Web Crypto and stored only as SHA-256 hashes
- founder metrics require a Cloudflare secret and return aggregate data only
- new creator links keep the secret in the URL fragment and private APIs receive it in an authorization header
- response APIs and private dashboards send `cache-control: no-store`
- rate-limit identifiers hash the request IP with the route scope before storage
- payments, push and WhatsApp Business integrations are disabled

## Known risks

- bearer links may leak through screenshots, clipboard history, referrers, analytics or messaging backups
- private answers and creator emails are currently plaintext in D1
- legacy query-string creator secrets remain accepted for backward compatibility and can appear in infrastructure logs
- there is no creator-link recovery or revocation independent of deleting the invitation
- D1 Time Travel may retain recoverable history for 7 days on Free or 30 days on Paid after active deletion

## Required production controls

- use a long random `FOUNDER_DASHBOARD_KEY` stored only in Cloudflare Secrets
- keep the GitHub repository private and require MFA for GitHub, Cloudflare and domain accounts
- enable secret scanning, dependency alerts and branch protection where available
- avoid third-party analytics on `/p/*`, `/g/*` and private API responses
- define automated expiry/deletion jobs and an encrypted backup retention policy
- perform a focused security and privacy review before public promotion or payment activation
- monitor `/api/privacy-proof` and the minute-level Cron purge heartbeat

## Supported versions

Only the currently deployed commit is supported during private beta. Record deployed commit hashes in releases as the product matures.
