# Human security review packet

[Español](HUMAN_SECURITY_REVIEW.es.md) · [Security policy](../SECURITY.md) · [Cryptographic protocol](CRYPTOGRAPHY.md) · [Automated audit](EXTERNAL_AUDIT.md)

This packet defines a reproducible scope for an independent cryptography review and web penetration test. It does **not** claim that such a human review has already happened.

## Requested reviewer independence

The reviewer must not have authored Z4SK and must disclose commercial or personal conflicts. Findings should include evidence, reproducible steps, severity, affected commit and a retest result. Real invitation links, production credentials and user data must never be included in the report.

## In-scope targets

- public source at `https://github.com/josejnet/z4sk`;
- the exact production commit displayed at `https://z4sk.vercel.app/audit` and in `/api/privacy-proof`;
- disposable invitations created solely for the review;
- browser cryptography in `app/lib/invitation-crypto.ts` and `app/lib/response-crypto.ts`;
- API authorization, expiry, one-time consumption, deletion, abuse controls and retention;
- GitHub Actions, migrations, service worker, CSP and deployment boundaries.

## Required test questions

1. Can the server, database, logs or founder endpoint recover invitation or answer plaintext from stored state alone?
2. Can an unauthorized party list, guess, read, modify, replay or delete invitations or responses?
3. Are AES-GCM nonces, ECDH keys, HKDF context, entropy and authenticated envelopes used safely?
4. Do concurrent submissions bypass view-once or single-response constraints?
5. Can URL fragments, bearer headers, service-worker caches, browser history, referrers, CSP reports or errors leak a complete secret link?
6. Can a compromised dependency, CI job, maintainer account or deployment substitute client code without visible evidence?

## Safety and reporting

Use GitHub [private vulnerability reporting](https://github.com/josejnet/z4sk/security/advisories/new) for findings. Do not attack provider infrastructure, other users, availability or production data. Rate-limit active tests and use only reviewer-owned disposable records. The project owner should publish a redacted report, fixes and retest evidence after remediation.

## Current evidence and explicit limitation

CodeQL, OWASP ZAP, OpenSSF Scorecard, dependency auditing and the encrypted staging E2E suite are documented in [EXTERNAL_AUDIT.md](EXTERNAL_AUDIT.md). They are useful evidence but do not replace the independent human work described here.
