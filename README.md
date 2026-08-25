# Z4SK

Z4SK is an English-first, mobile-first viral questionnaire web app. A creator makes a private invitation, sends the public link through WhatsApp, and reads responses through a separate secret dashboard link.

Production is deployed from `main` to Vercel.

## Documentation

- [Product and growth model](docs/PRODUCT.md)
- [System architecture and data model](docs/ARCHITECTURE.md)
- [Vercel deployment and rollback](docs/DEPLOYMENT.md)
- [Security, privacy and threat model](SECURITY.md)
- [Operations and incident runbook](docs/OPERATIONS.md)
- [Commercial roadmap](docs/ROADMAP.md)
- [Sellable asset register](SELLABLE_ASSETS.md)

## Product features

- English (US), Spanish, Italian, French, German, Dutch, Esperanto, Portuguese, Simplified Chinese, Hindi, Japanese, Turkish and Machine/JSON question libraries
- 12/24/48/72-hour destruction countdown
- optional one-response, view-and-destroy mode
- double-blind interest match with a creator-customizable match question
- optional 30-second-per-question challenge with two mandatory recipient acknowledgements, automatic advance and no backtracking
- end-to-end encrypted response payloads using ECDH P-256, HKDF-SHA-256 and AES-256-GCM; the only private key stays in the creator URL fragment/QR and never enters the database
- private creator dashboard and emoji reactions
- Smart Mix question ranking based only on aggregate completion signals
- sponsor packs, HTML/PNG/JPG invitation export, public/private QR cards and share-to-unlock ad removal
- installable PWA, founder metrics and reusable `packages/z4sk-sdk`
- abuse reporting, automatic closure and IP-based rate limits
- exact expiry access cut-off, uncapped daily background purging, database-enforced single response, atomic view-once deletion-before-return, creator/recipient deletion and public live privacy proof
- payment surface intentionally disabled until commercial launch

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

The site runs at `http://localhost:3000`. In local development, the founder dashboard key defaults to `dev-founder`. Production must set a long random `FOUNDER_DASHBOARD_KEY`.

## Vercel deployment

Production uses Next.js functions on Vercel backed by Neon Postgres. GitHub `main` is connected to automatic production deployments.

```bash
vercel --prod
```

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
