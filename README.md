# Pásalo

Pásalo is an English-first, mobile-first viral questionnaire web app. A creator makes a private invitation, sends the public link through WhatsApp, and reads responses through a separate secret dashboard link.

## Product features

- English (US), Spanish, Italian, French and German question libraries
- 12/24/48/72-hour destruction countdown
- optional one-response, view-and-destroy mode
- double-blind interest match
- private creator dashboard and emoji reactions
- Smart Mix question ranking based only on aggregate completion signals
- sponsor packs, HTML invitation export and share-to-unlock ad removal
- installable PWA, founder metrics and reusable `packages/pasalo-sdk`
- abuse reporting, automatic closure and IP-based rate limits
- payment surface intentionally disabled until commercial launch

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

The site runs at `http://localhost:3000`. In local development, the founder dashboard key defaults to `dev-founder`. Production must set a long random `FOUNDER_DASHBOARD_KEY`.

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
