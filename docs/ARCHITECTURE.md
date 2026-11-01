# Architecture

For the protocol, server-visible data and threat boundaries, read [Cryptographic design](CRYPTOGRAPHY.md). For vulnerability reporting and production controls, read [SECURITY.md](../SECURITY.md).

## Runtime

- UI and API: React 19 with Next.js App Router
- application runtime: Vercel Functions
- persistence: Neon Postgres
- schema management: versioned idempotent migrations in `scripts/migrations.mjs`
- PWA: web manifest and deliberately restricted service-worker cache
- integration asset: framework-neutral TypeScript client in `packages/z4sk-sdk`

## Encrypted request flow

```text
Creator browser
  generates invitation AES key + creator token + ECDH response key pair
  encrypts names, questions, settings and ECDH public key
         |
         | invitation ciphertext + token hash + minimal policy
         v
Vercel Function <--> Neon Postgres
         ^              invitation ciphertext + response ciphertext
         |
         | ephemeral ECDH + HKDF-SHA-256 + AES-256-GCM ciphertext
Recipient browser

Public URL fragment: invitation AES key
Creator URL fragment: invitation AES key + bearer token + response private key
```

URL fragments are not included in normal HTTP requests. The client sends only the bearer token to private APIs in an `Authorization: Bearer` header; Postgres stores its SHA-256 hash. Neither decryption key is sent to the API. Private and mutable responses use `Cache-Control: no-store`.

The creator browser encrypts the complete invitation payload with AES-256-GCM before `POST /api/games`. The recipient downloads the envelope and decrypts it locally. For each response, the recipient creates an ephemeral ECDH P-256 key pair, derives an AES-256-GCM key through HKDF-SHA-256 and encrypts all response content before `POST /responses`. The creator dashboard performs both decryptions locally.

**The complete invitation URL is a password-equivalent bearer secret.** Its holder can decrypt the invitation. The creator URL adds authority to list ciphertext and the only private key that can decrypt responses.

Invitation and dashboard QR cards are rendered entirely in the browser. Z4SK never receives the optional recovery email; it is used locally to open `mailto:` and the user's email provider processes it only if sent.

## Data model

| Table | Purpose | Server-readable content |
| --- | --- | --- |
| `games` | invitation lifecycle and authorization | encrypted invitation envelope, question count, expiry, view-once/open/closed state, token hash and timestamps; legacy readable columns are blank for new rows |
| `responses` | submitted response lifecycle | authenticated ciphertext envelope, timestamps, single-use marker and hashed recipient deletion token; legacy plaintext columns are blank |
| `question_metrics` | legacy aggregate selection/completion signals | no answer text; new encrypted invitations do not generate per-question metrics |
| `trend_metrics` | aggregate country performance | no invitation or answer text |
| `product_events` | generic funnel events | keyed pseudonym and operational event type |
| `abuse_reports` | moderation state | reason category and random invitation ID |
| `rate_limits` | rotating request counters | keyed HMAC pseudonym; no raw IP |
| `privacy_status` | purge heartbeat and deletion totals | no content |

## API map

| Method and route | Responsibility | Access |
| --- | --- | --- |
| `POST /api/games` | accept an encrypted invitation | public, rate limited |
| `GET /api/games/:id` | return invitation ciphertext and state | public random ID |
| `DELETE /api/games/:id` | delete invitation graph | creator bearer token |
| `POST /api/games/:id/responses` | store browser-encrypted response | public, rate limited |
| `GET /api/games/:id/responses` | return ciphertext for local creator decryption | creator bearer token |
| `DELETE /api/games/:id/responses` | delete one response ciphertext | recipient deletion bearer token |
| `POST /api/games/:id/consume` | atomically delete and return one ciphertext | creator bearer token |
| `POST /api/games/:id/unlock` | record a generic share-unlock event | public |
| `POST /api/games/:id/report` | report abuse and close at threshold | public, rate limited |
| `GET /api/founder/metrics` | aggregate business dashboard | founder bearer secret |
| `GET /api/privacy-proof` | live schema, data and retention checks | public |

## Source map

- `app/lib/invitation-crypto.ts`: invitation encryption, decryption and wire hydration
- `app/lib/response-crypto.ts`: response ECDH/HKDF/AES encryption
- `app/components/Builder.tsx`: creator-side secret generation and encrypted creation
- `app/g/[id]`: recipient-side invitation decryption and response encryption
- `app/p/[id]`: creator-side invitation/response decryption
- `app/api`: storage, lifecycle, retention, metrics and sponsor APIs
- `scripts/verify-e2ee.mjs`: isolated end-to-end encrypted data-flow verifier
- `app/api/privacy-proof/route.ts`: public live control evidence
- `packages/z4sk-sdk`: reusable browser SDK implementing the same encrypted creation flow

## Architecture decisions

- No user accounts: high-entropy bearer links grant narrowly scoped capabilities.
- Invitation and response E2EE: private content is encrypted before it reaches the API.
- Minimal readable lifecycle state: expiry and one-time consumption remain enforceable without decryption.
- No new per-question analytics: encrypted question text never enters server metrics.
- Payments off by default: growth is validated before adding checkout and compliance scope.
- Exact access expiry plus asynchronous physical purge: every route rejects expired rows, while daily and opportunistic cleanup remove them.
- Atomic view-once: Postgres deletes the complete active graph before returning the single ciphertext.
- Public auditability: the code, CI workflow, protocol documentation and runtime self-audit are linked from the application.
