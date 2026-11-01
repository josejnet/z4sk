# External automated security audit — 1 November 2026

[Español](EXTERNAL_AUDIT.es.md) · [Security policy](../SECURITY.md) · [Cryptographic design](CRYPTOGRAPHY.md) · [Live self-audit](https://z4sk.vercel.app/audit)

## Executive result

**Conditional pass.** Independent automated scanners found no known dependency vulnerability, leaked secret, high-risk dynamic finding or open CodeQL code alert after remediation. The application passed its build, lint, unit/render checks, encrypted staging E2E suite and production deployment gate.

The automated findings have been remediated or explicitly accepted. `main` is now protected and production has a manual release gate. Because the project still has one maintainer and the owner retains an emergency administrator bypass, this is not equivalent to independent human review.

This is an automated independent-tool assessment, **not** a human penetration test, formal certification, legal opinion or cryptographic proof.

## Scope and evidence

| Area | Independent control | Evidence |
| --- | --- | --- |
| Source SAST | GitHub CodeQL, `security-extended`, remote threat model | [Remediated scan](https://github.com/josejnet/z4sk/actions/runs/41345217731) |
| Production DAST | OWASP ZAP 2.17.0 passive baseline against `https://z4sk.vercel.app` | [Baseline](https://github.com/josejnet/z4sk/actions/runs/41344732440) · [final post-remediation scan](https://github.com/josejnet/z4sk/actions/runs/41359038546) |
| Supply chain | OpenSSF Scorecard 2.5.0 | [Scorecard run](https://github.com/josejnet/z4sk/actions/runs/41345217661) · [public result](https://scorecard.dev/viewer/?uri=github.com/josejnet/z4sk) |
| Dependencies | npm advisory database and GitHub Dependabot | `npm audit`: 0; GitHub open alerts: 0 |
| Secrets | GitHub secret scanning and push protection | GitHub open alerts: 0 |
| Runtime controls | Public database/privacy checks | [`/api/privacy-proof`](https://z4sk.vercel.app/api/privacy-proof) |

The baseline DAST run exercised public pages and public static/API discovery only. It did not receive creator links, invitation keys, response keys, bearer tokens, credentials or real user data. No destructive or authenticated active attack was performed.

## Findings

| ID | Initial severity | Status | Finding and disposition |
| --- | --- | --- | --- |
| EA-01 | High scanner alert | Resolved / non-production | CodeQL found five unanchored URL assertions and then three substring assertions in a test file. They were not authorization or URL-validation logic. Assertions now match complete HTTPS origins and the final scan has 0 open CodeQL alerts. |
| EA-02 | Medium | Resolved | Dynamic React `style` attributes were replaced with semantic `<progress>` elements and SVG attributes. Production now enforces nonce-based `style-src` plus `style-src-attr 'none'`, and the final ZAP scan no longer reports `style-src 'unsafe-inline'`. |
| EA-03 | Medium | Resolved | The crawler discovered an undocumented `/api` 404 without CSP. It now returns JSON with `default-src 'none'`, `no-store` and `nosniff`. |
| EA-04 | Medium | False positive / accepted | `Access-Control-Allow-Origin: *` appears on public fonts, the manifest, `robots.txt` and `sitemap.xml`. ZAP found no authenticated or private API with wildcard CORS; these assets contain no confidential data. |
| EA-05 | Low | Resolved | Added `Cross-Origin-Embedder-Policy: require-corp` and disabled the `X-Powered-By` disclosure. |
| EA-06 | Low | False positive | ZAP reported missing HSTS on three static assets during the baseline. Direct repeated checks show `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` on HTML, API, icon and service-worker responses. |
| EA-07 | Informational | Validated | ZAP marked `lang` as potentially user-controlled. The value is accepted only when it exactly matches the fixed `LOCALES` allow-list before `document.documentElement.lang` is updated. |
| EA-08 | Supply-chain high | Mitigated / residual owner bypass | `main` requires the `verify` check, verified signatures, an up-to-date linear history, one approval, code-owner review and resolved conversations; force pushes and deletion are blocked. Production also requires a GitHub environment approval. The single owner retains an emergency administrator bypass for other rules, so a truly independent second reviewer is still an organisational requirement. |
| EA-09 | Browser hardening | Implemented, monitoring | Enforced CSP now reports violations and Trusted Types runs in report-only mode. The first-party endpoint discards full URLs, identifiers, blocked resources, source files, samples and network/user identifiers before storing only daily aggregate counters. |

## Scanner totals

The first OWASP ZAP baseline produced **0 high, 3 medium, 3 low and 13 informational alert types**. The final post-remediation scan produced **0 high, 1 medium, 1 low and 13 informational alert types**. The remaining medium type is the public-static-asset CORS observation in EA-04; the remaining low type is the disproved HSTS observation in EA-06.

OpenSSF Scorecard reported **5.6/10**. Its positive checks were: no known vulnerabilities, no dangerous workflows, pinned dependencies, least-privilege workflow tokens, a security policy, no committed binaries and an active dependency-update tool. Its score is reduced by the new repository age, single-maintainer history, no branch protection, no mandatory code review, no fuzzing, no OpenSSF badge and the deliberate absence of an open-source licence. Those process scores must not be confused with exploitable application vulnerabilities.

## Changes made during the audit

- enabled CodeQL default setup with the extended query suite and a remote threat model;
- added scheduled, commit-pinned OpenSSF Scorecard and OWASP ZAP workflows;
- added weekly Dependabot checks for npm and GitHub Actions;
- corrected all CodeQL test findings;
- removed `X-Powered-By`, added COEP and hardened `/api`;
- removed every runtime React `style` attribute and replaced the CSS allowance with nonce-based `style-src` plus `style-src-attr 'none'`;
- added privacy-preserving CSP reporting, report-only Trusted Types compatibility monitoring and public commit-to-deployment evidence;
- protected `main`, required verified signatures, added code ownership and placed production behind an explicit environment approval;
- published a bilingual scope packet for a genuinely independent human cryptographic review and pentest;
- verified `npm test`, `npm run lint`, `npm audit`, encrypted staging E2E and production deployment.

## Residual risk and recommended next step

The technical branch and release gates are in place. The remaining governance work cannot be truthfully automated: add a second independent maintainer/reviewer, verify MFA personally on GitHub, Vercel, Neon and the domain account, register and safely back up a personal signing key before creating local commits, and commission the human review defined in [HUMAN_SECURITY_REVIEW.md](HUMAN_SECURITY_REVIEW.md).

End-to-end encryption does not protect a leaked complete link, compromised device/browser/extension, malicious future deployment, screenshot or copied plaintext. Sharing a complete invitation link remains equivalent to sharing a password.

## Reproduction

```bash
npm ci
npm run lint
npm test
npm audit
gh workflow run scorecard.yml
gh workflow run zap-baseline.yml
```

CodeQL, Scorecard and ZAP continue on scheduled or repository events. Scorecard and ZAP action commits are pinned in `.github/workflows`; CodeQL uses GitHub-managed default setup. Third parties can inspect every run and configuration change over time.
