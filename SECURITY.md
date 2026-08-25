# Security policy

## Reporting a vulnerability

This is a private pre-launch repository. Report vulnerabilities privately to the repository owner; do not open a public issue or include private invitation URLs, answer text, credentials or personal data in GitHub.

## Security model

- creator dashboard URLs contain two independent secrets: an API bearer token and the only private response-decryption key; anyone possessing the complete URL can read that invitation's responses
- creator browsers generate ECDH P-256 key pairs with Web Crypto; Neon Postgres receives only the public key, while the private key remains in the creator URL fragment/QR
- recipient browsers encrypt the complete private payload with ephemeral ECDH P-256, HKDF-SHA-256 and AES-256-GCM before transmission; active Neon Postgres stores only the ciphertext envelope
- creator bearer tokens are generated with Web Crypto and stored only as SHA-256 hashes
- founder metrics require a Vercel and Neon secret and return aggregate data only
- new creator links keep the secret in the URL fragment and private APIs receive it in an authorization header
- response APIs and private dashboards send `cache-control: no-store`
- rate-limit identifiers use HMAC-SHA-256 with a server-only secret and a daily rotation bucket; raw IP addresses are not stored
- payments, push and WhatsApp Business integrations are disabled

## Known risks

- bearer links may leak through screenshots, clipboard history, referrers, analytics or messaging backups
- invitation metadata (creator/recipient display names, selected questions, locale and expiry) is not end-to-end encrypted
- a compromised page, browser, extension, device, clipboard, screenshot or complete creator URL can expose decrypted answers
- JavaScript can clear application state and mutable byte buffers after view-once consumption, but cannot prove physical erasure from browser memory managed by the runtime
- creator secrets are accepted only through the `Authorization` header; URL query-string keys are rejected
- there is no creator-link recovery or revocation independent of deleting the invitation
- Provider backups may retain recoverable ciphertext according to the configured Neon retention policy after active deletion; ciphertext remains unreadable without the private creator key

## Required production controls

- use a long random `FOUNDER_DASHBOARD_KEY` stored only in Vercel environment variables
- use a separate long random `RATE_LIMIT_HMAC_SECRET` stored only in Vercel environment variables and rotate it after a suspected disclosure
- keep the GitHub repository private and require MFA for GitHub, Vercel and Neon and domain accounts
- enable secret scanning, dependency alerts and branch protection where available
- avoid third-party analytics on `/p/*`, `/g/*` and private API responses
- retain exact expiry checks on every public/private response path, the daily background purge and the single-statement view-once consume path; never export private creator URLs with database backups
- perform a focused security and privacy review before public promotion or payment activation
- monitor `/api/privacy-proof` and investigate when the daily Cron heartbeat is older than 36 hours

## Supported versions

Only the currently deployed commit is supported during private beta. Record deployed commit hashes in releases as the product matures.
