# Security policy

## Reporting a vulnerability

This is a private pre-launch repository. Report vulnerabilities privately to the repository owner; do not open a public issue or include private invitation URLs, answer text, credentials or personal data in GitHub.

## Security model

- creator dashboard URLs are bearer secrets; anyone possessing one can read that invitation’s responses
- creator tokens are generated with Web Crypto and stored only as SHA-256 hashes
- founder metrics require a Cloudflare secret and return aggregate data only
- response APIs and private dashboards send `cache-control: no-store`
- rate-limit identifiers hash the request IP with the route scope before storage
- payments, push and WhatsApp Business integrations are disabled

## Known risks

- bearer links may leak through screenshots, clipboard history, referrers, analytics or messaging backups
- private answers and creator emails are currently plaintext in D1
- query-string secrets can appear in infrastructure logs unless redaction is configured
- there is no creator-link recovery or revocation independent of deleting the invitation
- in-process rate-limit records require periodic retention cleanup

## Required production controls

- use a long random `FOUNDER_DASHBOARD_KEY` stored only in Cloudflare Secrets
- keep the GitHub repository private and require MFA for GitHub, Cloudflare and domain accounts
- enable secret scanning, dependency alerts and branch protection where available
- avoid third-party analytics on `/p/*`, `/g/*` and private API responses
- define automated expiry/deletion jobs and an encrypted backup retention policy
- perform a focused security and privacy review before public promotion or payment activation

## Supported versions

Only the currently deployed commit is supported during private beta. Record deployed commit hashes in releases as the product matures.
