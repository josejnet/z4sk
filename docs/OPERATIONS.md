# Operations runbook

## Daily/weekly checks

- confirm homepage and invitation creation are responding
- watch Vercel Function errors, latency and Neon Postgres usage
- review founder conversion funnel and unusual country/source spikes
- review abuse-report volume and automatically closed invitations
- verify the public privacy proof reports a daily purge heartbeat no older than 36 hours and zero expired responses
- keep dependencies, question-library changes and releases attributable in Git

## Synthetic smoke test

Use non-personal test names and leave the optional email empty. Create a three-question invitation, verify both QR cards, load the public API, submit one response, read it with the secret creator URL, then delete the synthetic game. Never use real answers in test or issue logs.

With a local server on port 3001, run `npm run verify:e2ee` to execute the reproducible view-once privacy check. It generates a temporary client-side ECDH key pair, sends only ciphertext, consumes the response once, decrypts it with the creator key and verifies that the active invitation cannot be fetched or consumed again.

## Incident priorities

### Private link or answer exposure

1. Stop public traffic or disable the affected route.
2. Preserve only the minimum logs needed for investigation.
3. Identify affected game IDs and time window without copying answer text.
4. Delete exposed content when appropriate and document the decision.
5. Rotate the founder key, `RATE_LIMIT_HMAC_SECRET` and any infrastructure credentials involved.
6. Obtain legal/privacy advice on notification obligations.

### Elevated errors

1. Inspect Worker logs and deployment version.
2. Test homepage, Neon Postgres query and one API route independently.
3. Roll back application code if the latest version caused the fault.
4. Do not roll back or manually edit Neon Postgres until the migration impact is understood.

### Abuse campaign

1. Tighten scoped rate limits or Vercel Firewall rules.
2. Review aggregate report counts and affected game IDs.
3. Close abusive invitations; avoid inspecting answer text unless required and authorized.
4. Record action, rationale and retention/deletion outcome.

## Backup and export

Do not create long-lived exports containing private answers. Neon recovery history follows the restore window configured for the production project after active-row deletion. Verify that exact value in Neon, publish it through `NEON_RESTORE_WINDOW_HOURS`, and re-check it after plan or database changes. If an operational export is ever unavoidable, encrypt it, restrict access, document a short retention deadline and test secure deletion.

## Ownership handover

An acquisition handover must transfer the GitHub repository, Vercel project and Neon database, domains, trademark records, dependency/license inventory, founder-secret rotation procedure and access to aggregate metrics. Transfer credentials through a password manager, never through GitHub issues or repository files.
