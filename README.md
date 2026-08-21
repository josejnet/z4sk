# Z4SK

Z4SK is an English-first, mobile-first viral questionnaire web app. A creator makes a private invitation, sends the public link through WhatsApp, and reads responses through a separate secret dashboard link.

Production: [z4sk.z4sk-app.workers.dev](https://z4sk.z4sk-app.workers.dev)

## Documentation

- [Product and growth model](docs/PRODUCT.md)
- [System architecture and data model](docs/ARCHITECTURE.md)
- [Cloudflare deployment and rollback](docs/DEPLOYMENT.md)
- [Security, privacy and threat model](SECURITY.md)
- [Operations and incident runbook](docs/OPERATIONS.md)
- [Commercial roadmap](docs/ROADMAP.md)
- [Sellable asset register](SELLABLE_ASSETS.md)

## Product features

- English (US), Spanish, Italian, French, German, Dutch, Esperanto, Portuguese, Simplified Chinese, Hindi, Japanese, Turkish and Machine/JSON question libraries
- 12/24/48/72-hour destruction countdown
- optional one-response, view-and-destroy mode
- double-blind interest match
- private creator dashboard and emoji reactions
- Smart Mix question ranking based only on aggregate completion signals
- sponsor packs, HTML/PNG/JPG invitation export, public/private QR cards and share-to-unlock ad removal
- installable PWA, founder metrics and reusable `packages/z4sk-sdk`
- abuse reporting, automatic closure and IP-based rate limits
- one-minute expiry purging, immediate creator deletion and public live privacy proof
- payment surface intentionally disabled until commercial launch

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

The site runs at `http://localhost:3000`. In local development, the founder dashboard key defaults to `dev-founder`. Production must set a long random `FOUNDER_DASHBOARD_KEY`.

## Cloudflare deployment

Production uses a Cloudflare Worker backed by D1. The temporary launch URL is `https://z4sk.z4sk-app.workers.dev`; attach the branded domain before public launch.

```bash
npm run deploy:cloudflare
```

Apply new D1 migrations with `npx wrangler d1 migrations apply z4sk-db --remote` before deploying application code that depends on them.

## Verification

```bash
npm run lint
npm test
npm audit --omit=dev
```

After changing `db/schema.ts`, run `npm run db:generate` and commit the generated migration.

## Launch configuration

Copy `.env.example` to the environment manager. Stripe, push and WhatsApp Business credentials are reserved for later phases and are not required for the current friction-free share-to-unlock model.

See [SELLABLE_ASSETS.md](./SELLABLE_ASSETS.md) for the acquisition-ready IP and data-room checklist.
