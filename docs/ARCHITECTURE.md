# Architecture

## Runtime

- UI and API: React 19 with Next.js App Router
- runtime: Vercel Functions
- persistence: Neon Postgres
- schema management: idempotent SQL initialization
- PWA: web manifest and service worker
- integration asset: framework-neutral TypeScript client in `packages/z4sk-sdk`

## Request flow

```text
Creator browser: ECDH P-256 key pair
        | public key only
        v
Vercel Function <--> Neon Postgres: invitation metadata + response ciphertext
        ^
        | ephemeral ECDH + HKDF-SHA-256 + AES-256-GCM ciphertext
Recipient browser

Creator secret URL fragment: bearer token + private decryption key
        |
        +--> creator browser decrypts responses locally
```

The public URL contains only a random game ID. The creator URL fragment contains a 24-byte API bearer token plus the ECDH private key. Fragments are not included in HTTP requests. The client sends only the bearer token to private APIs in an `Authorization: Bearer` header; Postgres stores its SHA-256 hash. The decryption key is never sent to the API. API responses use `cache-control: no-store` for private or mutable data.

The creator browser generates an extractable ECDH P-256 key pair at invitation creation. Only the public point is stored with the game. The optional custom secret-match question is invitation metadata (`match_question`) and is never treated as private answer content; the two interest choices remain inside the encrypted response flow. Timed mode is invitation metadata (`timed_mode`); the browser enforces each question with an absolute deadline so background-tab throttling cannot pause the clock. At zero it preserves the text already entered, inserts a localized timeout marker when blank, and advances. For each submission, the recipient browser creates an ephemeral ECDH key pair, derives a per-response AES-256-GCM key using HKDF-SHA-256 with a random salt, and encrypts respondent name, answers, reactions and double-blind interest locally. The server receives an authenticated ciphertext envelope containing the ephemeral public point, salt, IV and ciphertext. The creator dashboard derives the same content key and decrypts locally.

Invitation and dashboard QR cards are rendered entirely in the browser. Z4SK never receives or stores the optional recovery email; it is used locally to open `mailto:`, and the user's email provider processes it only if the message is sent. New API writes force the legacy `creator_email` column to an empty string, and runtime initialization clears any older active values.

## Data model

| Table | Purpose | Sensitive content |
| --- | --- | --- |
| `games` | configuration, expiry, public encryption key and hashed creator token; legacy email column forced empty | display names and selected questions |
| `responses` | per-response authenticated ciphertext envelope; legacy plaintext columns forced empty | encrypted private payload only |
| `question_metrics` | aggregate selection/completion signals | no answer text |
| `trend_metrics` | aggregate country/language performance | no answer text |
| `product_events` | funnel and attribution events | pseudonymous game ID |
| `abuse_reports` | moderation reports | reason and game ID |
| `rate_limits` | hashed IP-derived request counters | hashed identifier |
| `privacy_status` | latest purge heartbeat and aggregate deletion counts | no personal data |

## API map

| Method and route | Responsibility | Access |
| --- | --- | --- |
| `POST /api/games` | create an invitation | public, rate limited |
| `GET /api/games/:id` | load public questionnaire | public ID |
| `DELETE /api/games/:id?key=` | delete invitation and responses | creator token |
| `POST /api/games/:id/responses` | store a browser-encrypted response | public, rate limited |
| `GET /api/games/:id/responses` | return ciphertext for local creator decryption | creator bearer token |
| `POST /api/games/:id/consume` | atomically delete and return one ciphertext, then delete the invitation | creator bearer token |
| `POST /api/games/:id/unlock` | record share unlock | public |
| `POST /api/games/:id/report` | report abuse and trigger closure threshold | public, rate limited |
| `GET /api/smart-mix` | rank questions from aggregate signals | public |
| `GET /api/trends` | privacy-thresholded country trends | public |
| `GET /api/founder/metrics` | aggregate business dashboard | founder bearer secret |
| `GET /api/privacy-proof` | live database privacy checks and purge status | public |

## Source map

- `app/components/Builder.tsx`: creator funnel
- `app/components/QrCard.tsx`: localized, on-device public/private QR image export
- `app/g/[id]`: recipient experience
- `app/p/[id]`: private creator panel
- `app/founder`: aggregate founder analytics
- `app/lib/questions.ts`: versioned question library
- `app/lib/i18n.tsx` and `flow-copy.ts`: localization
- `db/schema.ts` and `drizzle/`: data model and migrations
- `db/runtime.ts`: Neon access, hashing, events and rate limits
- `vercel.json`: Vercel framework and retention-cron configuration

## Architecture decisions

- No user account database: possession of a high-entropy URL fragment grants creator access.
- End-to-end response encryption: the application server and database never receive the private decryption key or answer plaintext.
- No answer-text, answer-length or match-choice analytics: strategic datasets use question hashes and aggregate completion counters.
- Vercel-managed Neon: one deployment surface, standard PostgreSQL and portable SQL data.
- Payments off by default: growth is validated before adding checkout friction and compliance scope.
- A Vercel Cron runs daily on the Hobby plan and removes expired games, ciphertext responses and abuse reports. Explicit deletion is immediate. View-once consumption uses `DELETE … RETURNING` so the active response row is removed before its ciphertext is returned; the invitation is then deleted and the browser removes the secret fragment and key state after local decryption.
