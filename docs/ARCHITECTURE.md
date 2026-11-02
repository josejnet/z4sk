# Architecture

For the exact protocol and threat boundaries, read [Cryptographic design](CRYPTOGRAPHY.md). For reporting and production controls, read [SECURITY.md](../SECURITY.md).

## Runtime

- UI/API: React 19 and Next.js App Router
- runtime: Vercel Functions
- persistence: Neon Postgres
- migrations: idempotent versions in `scripts/migrations.mjs`
- PWA: installable manifest and restricted service-worker cache
- integration: framework-neutral TypeScript client in `packages/z4sk-sdk`

## Two-channel invitation flow

```text
Creator browser
  generates link secret + content key + creator token + ECDH response pair
  creates or scans a reusable 256-bit shared key
  HKDF(link secret || shared key) -> AES wrapping key
  wraps content key and encrypts invitation locally
         |
         | v2 ciphertext + token hash + minimal lifecycle metadata
         v
Vercel Function <--> Neon Postgres
         ^              invitation ciphertext + response ciphertext
         |
Recipient browser
  receives the link through channel A
  scans shared-key QR / enters 24 words received through channel B
  decrypts invitation locally
  encrypts response using ephemeral ECDH + HKDF + AES-GCM
```

The URL fragment contains only the link secret. The reusable shared key never enters a URL, API request, database row, application log, service-worker cache or localStorage. Camera frames and uploaded QR images are decoded locally and are not uploaded. The creator dashboard also needs that shared key to decrypt the invitation context.

The creator bearer token is sent transiently in an `Authorization` header; Postgres stores only its SHA-256 hash. The response private key remains in the creator URL fragment. Private and mutable responses use `Cache-Control: no-store`.

## Data model

| Table | Purpose | Server-readable content |
| --- | --- | --- |
| `games` | invitation lifecycle/authorization | v2 invitation envelope, question count, expiry, view-once/open/closed state, token hash and timestamps |
| `responses` | submitted response lifecycle | authenticated ciphertext, timestamps, single-use marker and hashed recipient deletion token |
| `question_metrics` | legacy aggregate signals | no answer text; new encrypted invitations create no per-question metric |
| `trend_metrics` | aggregate country performance | no invitation or answer text |
| `product_events` | generic funnel events | keyed pseudonym and operational event type |
| `abuse_reports` | moderation state | reason category and random invitation ID |
| `rate_limits` | rotating counters | keyed HMAC pseudonym; no raw IP |
| `privacy_status` | purge evidence | no private content |

## API map

| Method and route | Responsibility | Access |
| --- | --- | --- |
| `POST /api/games` | accept a v2 encrypted invitation | public, rate limited |
| `GET /api/games/:id` | return ciphertext and state | public random ID |
| `DELETE /api/games/:id` | delete invitation graph | creator bearer token |
| `POST /api/games/:id/responses` | store encrypted response | public, rate limited |
| `GET /api/games/:id/responses` | return ciphertext for local decryption | creator bearer token |
| `DELETE /api/games/:id/responses` | delete one response ciphertext | recipient deletion token |
| `POST /api/games/:id/consume` | atomically delete/return one ciphertext | creator bearer token |
| `POST /api/games/:id/report` | report abuse and close at threshold | public, rate limited |
| `GET /api/founder/metrics` | aggregate business dashboard | founder bearer secret |
| `GET /api/privacy-proof` | schema/data/control evidence | public |

## Source map

- `app/lib/shared-key.ts`: random shared keys, QR payloads, fingerprints and 24-word conversion
- `app/components/SharedKeySetup.tsx`: generate or select a previous key
- `app/components/SharedKeyUnlock.tsx`: local camera/image/word reader
- `app/lib/invitation-crypto.ts`: v2 derivation, key wrapping, encryption and decryption
- `app/lib/response-crypto.ts`: response ECDH/HKDF/AES encryption
- `app/components/Builder.tsx`: encrypted creation
- `app/g/[id]`: recipient decryption and response encryption
- `app/p/[id]`: creator decryption
- `scripts/verify-e2ee.mjs`: isolated end-to-end verifier
- `packages/z4sk-sdk`: reusable browser client for the same v2 protocol

## Decisions

- No accounts: random bearer capabilities plus a separately shared key.
- Mandatory two-channel decryption for every new invitation; v1 envelopes are rejected.
- Reusable key convenience without server-side storage or recovery.
- No implicit persistence: shared keys live in browser memory only unless users save the QR/words themselves.
- Minimal server-readable lifecycle state permits expiry, view-once and deletion without plaintext.
- No new per-question analytics because question text never reaches the server.
- Public source, CI, a protocol document and runtime self-audit make claims inspectable without calling them an independent certification.
