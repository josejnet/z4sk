# Product

## One-line proposition

Z4SK lets someone create a short private questionnaire, send it through WhatsApp and receive answers through a secret creator link. Expiry, view-once mode and double-blind matching create urgency and trust.

## Core journey

1. The creator enters names, optionally keeps an email address on-device, chooses an intensity and selects 3–12 questions.
2. The server returns a public answer URL and a separate bearer-secret creator URL.
3. The creator shares the public URL through WhatsApp, downloads a standalone HTML invitation or exports a localized PNG/JPG invitation card with a public QR.
4. The recipient reacts and answers. In double-blind mode, a match is revealed only when both people opted in.
5. The creator opens the private URL to read responses. The secret URL can be saved as a private on-device QR image. View-once invitations seal after the first response and are destroyed after consumption.

Email is optional and never sent to the Z4SK API or stored in D1. When supplied, it is used only in the browser to open the device mail client with a pre-filled message; the user's email provider processes it if the message is sent. The private dashboard QR is the primary no-email recovery artifact; anyone who scans it receives creator access, so it must not be shared.

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
- thirteen language/machine modes
- localized PNG/JPG QR cards for public invitation sharing and private dashboard recovery
- aggregate Smart Mix and country-trend signals without analyzing answer text
- reusable `@z4sk/viral-quiz-sdk`

## Product metrics

The founder dashboard measures created, opened, responded, matched and unlocked events; open and response conversion; language, country, sponsor pack and source; active inventory; and question-library segment performance. It never returns answer text.

## Current limitations

- creator access depends on possession of the secret URL or private QR; there is no server-side recovery flow
- optional email delivery uses `mailto:`, remains device-local and depends on the user’s configured mail app
- push, WhatsApp Business webhooks and payments are placeholders only
- user-generated answers are stored as plaintext in active D1 until explicit deletion, view-once consumption or the one-minute expiry purge removes them; Cloudflare recovery history can persist for its Time Travel window
- formal trademark clearance and legal review remain outstanding
