# Product

## One-line proposition

Z4SK lets someone create a short private questionnaire, send it through WhatsApp and receive answers through a secret creator link. Expiry, view-once mode, 30-second challenges and double-blind matching create urgency and trust.

## Core journey

1. The creator enters names, optionally keeps an email address on-device, chooses an intensity and selects 3–12 questions.
2. The browser creates the response encryption key pair. The server receives only the public key and returns a public answer URL plus a bearer-secret creator URL; the browser appends the only private decryption key locally.
3. The creator shares the public URL through WhatsApp, downloads a standalone HTML invitation or exports a localized PNG/JPG invitation card with a public QR.
4. The recipient reacts and answers. If the creator enabled the 30-second challenge, the recipient must acknowledge the rule twice; each question then has an absolute 30-second deadline, locks the current text at zero and advances without back navigation. Their browser encrypts the respondent name, answers, reactions and interest choice before sending anything private to D1.
5. The creator opens the private URL and responses are decrypted only in that browser. In double-blind mode, the browser reveals a match only when both opted in. The secret URL can be saved as a private on-device QR image. View-once invitations seal after the first response; consumption atomically removes the active row, then the browser decrypts once and discards its key state.

Email is optional and never sent to the Z4SK API or stored in D1. When supplied, it is used only in the browser to open the device mail client with a pre-filled message; the user's email provider processes it if the message is sent. The private dashboard QR is the primary no-email recovery artifact and contains the only decryption key. Anyone who scans it receives creator access and can decrypt responses, so it must not be shared.

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
- optional 30-second questions with two explicit acknowledgements, deadline-based timing and automatic advance
- end-to-end encrypted response payloads with the private key held only by the creator link
- private bearer dashboard separate from the public link
- thirteen language/machine modes
- localized PNG/JPG QR cards for public invitation sharing and private dashboard recovery
- aggregate Smart Mix and country-trend signals without analyzing answer text
- reusable `@z4sk/viral-quiz-sdk`

## Product metrics

The founder dashboard measures created, opened, responded and unlocked events; open and response conversion; language, country, sponsor pack and source; active inventory; and question-library segment performance. It never receives answer text, answer length, reactions, respondent names or match choices.

## Current limitations

- creator access depends on possession of the secret URL or private QR; there is no server-side recovery flow
- optional email delivery uses `mailto:`, remains device-local and depends on the user’s configured mail app
- push, WhatsApp Business webhooks and payments are placeholders only
- invitation metadata is visible to the service, but private response payloads are ciphertext in active D1; Cloudflare Time Travel can retain ciphertext and pre-migration legacy history for its recovery window
- the design cannot protect a leaked creator URL, compromised browser/device/extension or malicious JavaScript served to either endpoint; JavaScript memory clearing is best-effort rather than provable physical RAM erasure
- formal trademark clearance and legal review remain outstanding
