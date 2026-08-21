# Operations runbook

## Daily/weekly checks

- confirm homepage and invitation creation are responding
- watch Cloudflare Worker errors, latency and D1 usage
- review founder conversion funnel and unusual country/source spikes
- review abuse-report volume and automatically closed invitations
- verify the public privacy proof reports a purge within the last three minutes and zero expired responses
- keep dependencies, question-library changes and releases attributable in Git

## Synthetic smoke test

Use non-personal test names and leave the optional email empty. Create a three-question invitation, verify both QR cards, load the public API, submit one response, read it with the secret creator URL, then delete the synthetic game. Never use real answers in test or issue logs.

## Incident priorities

### Private link or answer exposure

1. Stop public traffic or disable the affected route.
2. Preserve only the minimum logs needed for investigation.
3. Identify affected game IDs and time window without copying answer text.
4. Delete exposed content when appropriate and document the decision.
5. Rotate the founder key and any infrastructure credentials involved.
6. Obtain legal/privacy advice on notification obligations.

### Elevated errors

1. Inspect Worker logs and deployment version.
2. Test homepage, D1 query and one API route independently.
3. Roll back application code if the latest version caused the fault.
4. Do not roll back or manually edit D1 until the migration impact is understood.

### Abuse campaign

1. Tighten scoped rate limits or Cloudflare rules.
2. Review aggregate report counts and affected game IDs.
3. Close abusive invitations; avoid inspecting answer text unless required and authorized.
4. Record action, rationale and retention/deletion outcome.

## Backup and export

Do not create long-lived exports containing private answers. Cloudflare D1 Time Travel remains available for 7 days on Free or 30 days on Paid even after active-row deletion. If an operational export is ever unavoidable, encrypt it, restrict access, document a short retention deadline and test secure deletion.

## Ownership handover

An acquisition handover must transfer the GitHub repository, Cloudflare account/resources, domains, trademark records, dependency/license inventory, founder-secret rotation procedure and access to aggregate metrics. Transfer credentials through a password manager, never through GitHub issues or repository files.
