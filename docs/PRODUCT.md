# Product

## One-line proposition

Z4SK lets someone create a short private questionnaire, send it through WhatsApp and receive answers through a secret creator link. Expiry, view-once mode, 30-second challenges and double-blind matching create urgency and trust.

## Core journey

1. The creator enters names, optionally keeps an email address on-device, chooses an intensity and selects 3–12 questions.
2. The browser creates the response encryption key pair, a random invitation content key and a random link secret. The creator also generates a reusable 256-bit shared key or scans a fixed shared-key QR previously exchanged with that person.
3. HKDF-SHA-256 combines the link secret and shared key to wrap the content key. The invitation is encrypted with AES-256-GCM before the API receives it. The creator sends the invitation link and shared-key QR (or equivalent 24 words) through different channels.
4. The recipient reacts and answers. If the creator enabled the 30-second challenge, the recipient must acknowledge the rule twice; each question then has an absolute 30-second deadline, locks the current text at zero and advances without back navigation. Their browser encrypts the respondent name, answers, reactions and interest choice before sending anything private to Neon Postgres.
5. The creator opens the private URL and presents the same shared key; responses are decrypted only in that browser. In double-blind mode, the browser reveals a match only when both opted in. The secret URL can be saved as a private on-device QR image, but that QR alone cannot decrypt without the separate shared key. View-once invitations seal after the first response; consumption atomically removes the active row, then the browser decrypts once and discards its key state.

Email is optional and never sent to the Z4SK API or stored in Neon Postgres. When supplied, it is used only in the browser to open the device mail client with a pre-filled message; the user's email provider processes it if the message is sent. The private dashboard QR is a sensitive bearer-capability artifact: it contains the creator URL but not the separately shared key. Anyone who obtains both can open the dashboard and decrypt responses, so the two channels must not be shared together.

## Audience and positioning

- friends, couples and dating conversations
- party, nightlife and creator communities
- sponsored question packs for venues, beverages and influencers
- partners licensing the question engine through the SDK

## Growth loop

Create → share → open → answer → match/read → remix. Ad removal is currently unlocked by sharing, which provides a one-tap non-cash monetization/growth exchange. Payments remain intentionally disabled until conversion data justifies activation.

## Differentiation

- time-limited and optional single-response invitations
- double-blind consent logic with a creator-customizable question
- optional 30-second questions with two explicit acknowledgements, deadline-based timing and automatic advance
- end-to-end encrypted invitation and response payloads, with two separate user-held secrets required to open an invitation
- private bearer dashboard separate from the public link
- thirteen language/machine modes
- localized PNG/JPG QR cards for public invitation sharing and private dashboard recovery
- aggregate Smart Mix and country-trend signals without analyzing answer text
- reusable `@z4sk/viral-quiz-sdk`

## Product metrics

The founder dashboard measures created, opened, responded and unlocked events; open and response conversion; language, country, sponsor pack and source; active inventory; and question-library segment performance. It never receives answer text, answer length, reactions, respondent names or match choices.

## Current limitations

- creator access depends on possession of the secret URL or private QR **and** the separately shared key; there is no server-side recovery flow
- optional email delivery uses `mailto:`, remains device-local and depends on the user’s configured mail app
- push, WhatsApp Business webhooks and payments are placeholders only
- operational invitation metadata remains visible to the service, but display names, questions, settings and response payloads are ciphertext in active Neon Postgres; provider recovery can retain ciphertext for its configured window
- the design cannot protect when both access channels leak, or against a compromised browser/device/extension, camera/clipboard capture or malicious JavaScript served to either endpoint; JavaScript memory clearing is best-effort rather than provable physical RAM erasure
- formal trademark clearance and legal review remain outstanding
