# Architecture

## Runtime

- UI and API: React 19 with vinext/App Router
- edge runtime: Cloudflare Workers
- persistence: Cloudflare D1 (SQLite)
- schema management: Drizzle definitions and SQL migrations
- PWA: web manifest and service worker
- integration asset: framework-neutral TypeScript client in `packages/z4sk-sdk`

## Request flow

```text
Browser / WhatsApp
        |
        v
Cloudflare Worker (React pages + API routes)
        |
        +--> D1: games and private responses
        +--> D1: aggregate product/trend metrics
        +--> static PWA and Open Graph assets
```

The public URL contains only a random game ID. The creator URL places a 24-byte random token in the URL fragment, which browsers do not send to the server; the client sends it to private APIs in an `Authorization: Bearer` header. Only its SHA-256 hash is stored in D1. API responses use `cache-control: no-store` for private or mutable data.

Invitation and dashboard QR cards are rendered entirely in the browser. Z4SK never receives or stores the optional recovery email; it is used locally to open `mailto:`, and the user's email provider processes it only if the message is sent. New API writes force the legacy `creator_email` column to an empty string, and runtime initialization clears any older active values.

## Data model

| Table | Purpose | Sensitive content |
| --- | --- | --- |
| `games` | configuration, expiry and hashed creator token; legacy email column forced empty | display names |
| `responses` | respondent name, answer and reaction JSON, match flag | private answers |
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
| `POST /api/games/:id/responses` | submit answers | public, rate limited |
| `GET /api/games/:id/responses?key=` | read creator dashboard | creator token |
| `POST /api/games/:id/consume` | consume view-once response | creator token |
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
- `db/runtime.ts`: D1 access, hashing, events and rate limits
- `worker/index.ts` and `wrangler.jsonc`: Cloudflare entry and bindings

## Architecture decisions

- No user account database: possession of a high-entropy URL fragment grants creator access.
- No answer-text analytics: strategic datasets use question hashes and aggregate counters.
- D1 over external SaaS: one deployment surface, low initial cost and portable SQL data.
- Payments off by default: growth is validated before adding checkout friction and compliance scope.
- A Worker Cron runs every minute and removes expired games, responses and abuse reports from active D1; explicit delete and view-once consumption delete immediately.
