# Z4SK

[English](README.md) · [Español](README.es.md) · [Live application](https://z4sk.vercel.app) · [Public security audit](https://z4sk.vercel.app/audit) · [CI](https://github.com/josejnet/z4sk/actions/workflows/ci.yml)

**Ask. Answer. Dare.** Z4SK is an English-first, mobile-first private questionnaire app. A creator prepares an invitation, shares the public link, and reads encrypted responses through a separate secret dashboard link.

![Z4SK home page](docs/screenshots/home-en.png)

## Why Z4SK

- No account is required.
- Invitations expire after 12, 24, 48 or 72 hours.
- Optional view-once mode removes the active invitation graph before returning the only ciphertext read.
- Invitation names, questions, settings and response public key are encrypted in the creator browser with AES-256-GCM.
- Responses are encrypted in the recipient browser with ECDH P-256, HKDF-SHA-256 and AES-256-GCM.
- Both complete links are bearer secrets. Sharing the invitation link is equivalent to sharing a password; the creator link additionally grants response access.
- The creator's private decryption key remains in the secret URL fragment or private QR; it is never sent to the API.
- A recipient receives a separate deletion link for their own response.
- Double-blind interest matching reveals a match only when both people opt in.
- The optional 30-second challenge uses absolute deadlines, automatic advance and no backtracking.
- Thirteen language and machine-readable question libraries are included.

## Product tour

The four-step builder collects only what is needed to create the invitation. The optional email address stays in the browser and is used only to open the device mail application.

![Questionnaire builder in Spanish](docs/screenshots/builder-es.png)

The core journey is:

```text
Creator browser
  -> generates invitation AES key + creator token + ECDH key pair
  -> encrypts names, questions, settings and public key locally
  -> sends ciphertext + token hash + minimal lifecycle policy
  -> shares /g/:id#invite=<invitation-key>

Recipient browser
  -> decrypts the invitation locally
  -> encrypts the complete private response locally
  -> stores ciphertext through POST /api/games/:id/responses

Creator browser
  -> opens /p/:id#key=<bearer>&invite=<invitation-key>&decrypt=<private-key>
  -> downloads invitation + response ciphertext with the bearer token
  -> decrypts both locally
```

## Technology

- Next.js App Router, React and TypeScript
- Vercel Functions and Vercel Cron
- Neon Postgres through `@neondatabase/serverless`
- Web Crypto for client-side authenticated encryption
- Installable PWA with an intentionally restricted service-worker cache
- Framework-neutral client in `packages/z4sk-sdk`

## Local development

Requirements: Node.js 24 and a Neon/Postgres connection string.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. In local development the founder dashboard key defaults to `dev-founder`; production must use a long random `FOUNDER_DASHBOARD_KEY`.

## Verification

The standard quality gate builds the production bundle, checks rendered output and runs a production-dependency audit:

```bash
npm run lint
npm test
npm audit
```

The staging verification requires a dedicated database named `z4sk_staging_e2e`, starts the built app against it, exercises creation, encryption, concurrent view-once submission, abuse-report deduplication, metadata privacy, decryption, recipient deletion and exact expiry, and then stops the local server:

```bash
npm run verify:e2e:staging
```

Put its restricted connection string in `Z4SK_STAGING_DATABASE_URL`, or use a development `DATABASE_URL` that points to that exact database. The verifier rejects every other database name, including production. Schema changes are versioned in `scripts/migrations.mjs` and run with `npm run db:migrate` before deployment.

## Privacy, security and public auditability

Z4SK keeps invitation and response plaintext out of its creation/response APIs and active database for new invitations. It is still not anonymous: random identifiers, question count, lifecycle state, expiry and timestamps remain visible, and infrastructure necessarily processes request paths and network metadata.

**Treat every complete link like a password.** An invitation-link holder can decrypt names, questions and settings and submit until expiry. A creator-link holder can additionally authorize the dashboard and decrypt responses. A compromised browser, device, extension, deployment, clipboard or screenshot can reveal plaintext.

- [Public audit page](https://z4sk.vercel.app/audit): human-readable protocol, limits, source and live evidence.
- [External automated audit](docs/EXTERNAL_AUDIT.md): CodeQL, OWASP ZAP and OpenSSF findings, remediation and residual risk.
- [Human security review packet](docs/HUMAN_SECURITY_REVIEW.md): reproducible scope for an independent cryptography review and penetration test; it does not claim one has already occurred.
- [Cryptographic design](docs/CRYPTOGRAPHY.md): algorithms, payloads, visible data and threat boundaries.
- [Security policy](SECURITY.md): vulnerability reporting and production controls.
- [`/api/privacy-proof`](https://z4sk.vercel.app/api/privacy-proof): machine-readable runtime self-audit.

The repository and self-audit make the design inspectable; neither is an independent certification or remote attestation of every deployed response.

## Repository map

| Path | Responsibility |
| --- | --- |
| `app/components/Builder.tsx` | Creator questionnaire wizard |
| `app/g/[id]` | Public recipient experience |
| `app/p/[id]` | Secret creator dashboard |
| `app/cancel/[id]` | Recipient-owned response deletion |
| `app/api` | Invitation, response, retention, metrics and sponsor APIs |
| `app/lib/response-crypto.ts` | Browser encryption and decryption |
| `app/lib/invitation-crypto.ts` | Invitation AES-256-GCM encryption and wire hydration |
| `db/runtime.ts` | Neon runtime queries and purge operations |
| `scripts/migrations.mjs` | Versioned, pre-deployment database migrations |
| `scripts/verify-e2ee.mjs` | Full encrypted data-flow verifier |
| `packages/z4sk-sdk` | Reusable framework-neutral SDK |

## Deployment

Automatic Git deployments are disabled. A push to `main` runs the pinned GitHub Actions pipeline, including the isolated encrypted E2E suite. After every check passes, the protected production job applies versioned migrations with a migration-only credential and invokes a branch-scoped Vercel Deploy Hook. Runtime Functions use a separate DML-only database role; Vercel keeps the current production version active if the new build fails.

```bash
gh workflow run ci.yml
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for environment setup, rollback and post-deploy checks.

## Further documentation

- [Product and growth model](docs/PRODUCT.md)
- [System architecture and data model](docs/ARCHITECTURE.md)
- [Vercel deployment and rollback](docs/DEPLOYMENT.md)
- [Operations and incident runbook](docs/OPERATIONS.md)
- [Security, privacy and threat model](SECURITY.md)
- [External automated security audit](docs/EXTERNAL_AUDIT.md)
- [Human security review packet](docs/HUMAN_SECURITY_REVIEW.md)
- [Cryptographic protocol and auditable data boundary](docs/CRYPTOGRAPHY.md)
- [Commercial roadmap](docs/ROADMAP.md)
- [Brand and domain activation](docs/BRAND.md)
- [Sellable asset register](SELLABLE_ASSETS.md)

## Project status

Z4SK is a beta product with public source for third-party inspection. Payments, push delivery and WhatsApp Business integrations remain disabled. Creator access depends on possession of the secret URL or private QR, and there is deliberately no server-side recovery flow.

No open-source license is currently granted. The repository and its commercial assets remain proprietary unless the owner publishes a separate license.
