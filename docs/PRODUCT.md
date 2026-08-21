# Product

## One-line proposition

Z4SK lets someone create a short private questionnaire, send it through WhatsApp and receive answers through a secret creator link. Expiry, view-once mode and double-blind matching create urgency and trust.

## Core journey

1. The creator enters names and an email address, chooses an intensity and selects 3–12 questions.
2. The server returns a public answer URL and a separate bearer-secret creator URL.
3. The creator shares the public URL through WhatsApp or downloads a standalone HTML invitation.
4. The recipient reacts and answers. In double-blind mode, a match is revealed only when both people opted in.
5. The creator opens the private URL to read responses. View-once invitations seal after the first response and are destroyed after consumption.

The current “email my link” action opens the device mail client with a pre-filled message. There is no transactional email provider or password/account system in this release.

## Audience and positioning

- friends, couples and dating conversations
- party, nightlife and creator communities
- sponsored question packs for venues, beverages and influencers
- partners licensing the question engine through the SDK

## Growth loop

Create → share → open → answer → match/read → remix. Ad removal is currently unlocked by sharing, which provides a one-tap non-cash monetization/growth exchange. Payments remain intentionally disabled until conversion data justifies activation.

## Differentiation

- time-limited and optional single-response invitations
- double-blind consent logic
- private bearer dashboard separate from the public link
- eleven language/machine modes
- aggregate Smart Mix and country-trend signals without analyzing answer text
- reusable `@z4sk/viral-quiz-sdk`

## Product metrics

The founder dashboard measures created, opened, responded, matched and unlocked events; open and response conversion; language, country, sponsor pack and source; active inventory; and question-library segment performance. It never returns answer text.

## Current limitations

- creator access depends on possession of the secret URL; there is no recovery flow
- email delivery uses `mailto:` and depends on the user’s configured mail app
- push, WhatsApp Business webhooks and payments are placeholders only
- user-generated answers are stored as plaintext in D1 until deletion or expiry operations remove them
- formal trademark clearance and legal review remain outstanding
