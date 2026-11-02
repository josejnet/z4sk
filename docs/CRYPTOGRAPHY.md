# Cryptographic design / Diseño criptográfico

[English](#english) · [Español](#español) · [Security policy](../SECURITY.md) · [Live audit](https://z4sk.vercel.app/audit) · [Machine-readable proof](https://z4sk.vercel.app/api/privacy-proof)

## English

### Scope and security goal

Z4SK encrypts invitation and response content in the browsers. A database disclosure should expose authenticated ciphertext and operational metadata, not display names, questions, settings, respondent names or answers.

Every new invitation uses **two independent user-held secrets**:

1. a 256-bit random link secret in the URL fragment; and
2. a reusable 256-bit shared key represented as a QR code or the equivalent 24 Spanish BIP39 words.

The link alone cannot decrypt the invitation. The shared key is never placed in a URL, request, API response or database row. It is scanned with the camera, read from a local QR image, or entered as 24 words. QR and words are two representations of the same key, not two factors.

> Treat the invitation link as the first half of a password and the shared key as the second. Send them through different channels. Anyone who obtains both can decrypt the invitation. The creator link additionally authorizes the dashboard and carries the response private key.

### Protocol

```mermaid
sequenceDiagram
  participant C as Creator browser
  participant A as Z4SK API
  participant D as Neon Postgres
  participant R as Recipient browser

  C->>C: Generate link secret, content key, token and ECDH P-256 pair
  C->>C: Create or scan reusable shared key
  C->>C: HKDF(link secret || shared key) -> wrapping key
  C->>C: AES-256-GCM wrap content key; encrypt invitation with content key
  C->>A: v2 ciphertext envelope + SHA-256(token) + policy + question count
  A->>D: Store ciphertext and minimal operational metadata
  C-->>R: Link through channel A
  C-->>R: Shared-key QR/words through channel B
  R->>A: GET /api/games/:id
  A-->>R: ciphertext + state + expiry
  R->>R: Combine fragment secret + scanned key; decrypt locally
  R->>R: Ephemeral ECDH + HKDF-SHA-256 + AES-256-GCM encrypt response
  R->>A: response ciphertext envelope
  C->>A: Authorization: Bearer token
  A-->>C: invitation and response ciphertext
  C->>C: Scan same shared key and decrypt locally
```

### Invitation envelope v2

- Randomness: Web Crypto `crypto.getRandomValues` creates each 32-byte link, shared and content key, a 32-byte HKDF salt, and 12-byte AES-GCM IVs.
- Derivation: HKDF-SHA-256 with input key material `link_secret || shared_key`, the random salt and info `z4sk-invitation-key-v2` derives an AES-256 wrapping key.
- Key wrapping: AES-256-GCM encrypts the random content key with AAD `z4sk-invitation-key-v2`.
- Content encryption: AES-256-GCM encrypts the invitation payload with the content key and AAD `z4sk-invitation-content-v2`.
- Envelope: `{v:2, alg, salt, keyIv, wrappedKey, iv, ciphertext}`.
- Payload: creator/recipient display names, title, locale, level, questions, feature settings, pack, library version, creation time and the response ECDH public key.
- Link transport: only the link secret is base64url encoded in `#invite=`. URL fragments are not included in ordinary HTTP navigation requests.
- Shared-key transport: the QR payload is `Z4SK-KEY-V1:<32-byte-key>:<context-checksum>`. The 24 Spanish BIP39 words encode the same 256-bit key plus its BIP39 checksum. This is not a cryptocurrency wallet seed and must never be imported into a wallet.

The context checksum detects scanning/transcription mistakes; it is not an authentication factor. The QR may be reused for one trusted person, but reusing it links the risk of all invitations protected by it: rotate it after suspected exposure.

### Response envelope

- Key agreement: creator static ECDH P-256 public key and recipient ephemeral ECDH P-256 private key.
- Derivation: HKDF-SHA-256 with a random salt and versioned context.
- Encryption: AES-256-GCM with a fresh 12-byte IV.
- Content: respondent display name, answers, reactions and double-blind match choice.
- The creator's ECDH private key stays in the creator URL fragment.

### Authorization, deletion and retention

- Creator bearer token: 24 random bytes; only its SHA-256 hash is stored.
- Public invitation identifier: 16 random bytes.
- Recipient deletion token: 24 random bytes; only its hash is stored.
- View once: one database statement locks the row, returns ciphertext and deletes the active graph before browser decryption.
- Expiry: requests are rejected at the exact deadline; scheduled and opportunistic cleanup remove expired rows.

### Server-visible data

| Category | Server-readable | Encrypted / absent |
| --- | --- | --- |
| Invitation | random ID, v2 envelope, question count, expiry, state, timestamps | names, title, questions, locale, level, settings, response public key |
| Response | ciphertext envelope, invitation ID, submission time, single-use state | respondent name, answers, reactions, match choice |
| Authorization | token hashes; raw bearer token processed transiently | link secret, shared key, content key and response private key are not stored |
| Operations | reason category, approximate country, rate-limit HMAC, request paths and provider metadata | application code does not log bodies, URL fragments or decrypted content |

### Trust boundaries and limitations

- A link without the shared key is insufficient, but it remains sensitive and should not be public.
- Anyone obtaining both channels can decrypt. The server cannot revoke, recover or distinguish a copied shared key.
- A malicious future deployment, compromised browser/device/extension, clipboard, camera pipeline, screenshot or person viewing the plaintext can expose it.
- The browser holds required secrets and plaintext in process memory while the flow is open. Byte buffers are cleared best-effort, but JavaScript strings and browser internals cannot be guaranteed erased.
- Reusing one shared key is convenient but increases the impact of its compromise. Prefer one per person, compare fingerprints in person, and rotate when in doubt.
- Public source and runtime evidence improve auditability; they are not remote attestation or an independent cryptographic certification.

### Auditable evidence

- Shared-key encoding and fingerprints: [`app/lib/shared-key.ts`](../app/lib/shared-key.ts)
- Camera/image/words reader: [`app/components/SharedKeyUnlock.tsx`](../app/components/SharedKeyUnlock.tsx)
- Invitation v2 cryptography: [`app/lib/invitation-crypto.ts`](../app/lib/invitation-crypto.ts)
- Response cryptography: [`app/lib/response-crypto.ts`](../app/lib/response-crypto.ts)
- Creation endpoint: [`app/api/games/route.ts`](../app/api/games/route.ts)
- Isolated verifier: [`scripts/verify-e2ee.mjs`](../scripts/verify-e2ee.mjs)
- Runtime self-audit: [`app/api/privacy-proof/route.ts`](../app/api/privacy-proof/route.ts)

The current protocol deliberately rejects legacy v1 invitation envelopes. At the migration time the production database contained zero invitations and zero responses, so no active user link was retained or converted.

## Español

### Objetivo y modelo de acceso

Z4SK cifra en los navegadores el contenido de invitaciones y respuestas. Una filtración de la base debería revelar texto cifrado autenticado y metadatos operativos, no nombres, preguntas, ajustes ni respuestas.

Cada invitación nueva exige **dos secretos independientes en manos de los usuarios**:

1. un secreto aleatorio de 256 bits incluido en el fragmento del enlace; y
2. una llave compartida reutilizable de 256 bits, representada por un QR o por 24 palabras BIP39 en español.

El enlace solo no puede descifrar la invitación. La llave compartida nunca se añade a la URL, petición, respuesta de API o base de datos. Se lee con la cámara, desde una imagen local o introduciendo las 24 palabras. El QR y las palabras son dos formatos de la misma llave, no dos factores diferentes.

> Trata el enlace como la primera mitad de una contraseña y la llave compartida como la segunda. Envíalos por canales diferentes. Quien consiga ambos podrá descifrar la invitación. El enlace del creador añade la autorización del panel y la clave privada de respuestas.

### Flujo resumido

1. El navegador crea el secreto del enlace, una llave de contenido, un token y el par ECDH de respuestas.
2. El creador genera una llave compartida o escanea el QR fijo que ya usa con esa persona.
3. HKDF-SHA-256 combina `secreto_enlace || llave_compartida` con sal aleatoria y deriva una llave de envoltura.
4. AES-256-GCM envuelve la llave de contenido y cifra la invitación con contextos autenticados distintos.
5. La API recibe el sobre v2 cifrado, el hash del token y los metadatos mínimos.
6. El destinatario recibe enlace y QR/palabras por canales separados, combina ambos localmente y descifra.
7. La respuesta se cifra en el navegador con ECDH P-256, HKDF-SHA-256 y AES-256-GCM.
8. El creador vuelve a presentar la llave compartida para abrir la invitación y sus respuestas en el panel.

### Aleatoriedad y formato recuperable

Las llaves de 32 bytes se generan con `crypto.getRandomValues` de Web Crypto. Las 24 palabras españolas codifican exactamente los 256 bits de la llave y la suma de comprobación BIP39; no son una contraseña elegida por una persona ni una semilla de monedero. No deben importarse jamás en una cartera de criptomonedas.

El QR fijo incluye un prefijo de versión y una suma de comprobación contextual. La huella visible permite comparar copias. Reutilizar una llave con la misma persona es posible, pero aumenta el impacto de una filtración: conviene usar una por persona y sustituirla si hay cualquier duda.

### Límites honestos

El servidor sigue viendo identificadores aleatorios, fechas, estado, caducidad, número de preguntas, rutas y metadatos de red. Un atacante que consiga los dos secretos puede descifrar. También pueden revelar el contenido un navegador, dispositivo, extensión o despliegue malicioso, el portapapeles, una captura o la propia persona que ya ha visto el texto.

Los secretos y el texto legible permanecen temporalmente en la memoria del navegador mientras se usan. Los buffers binarios se limpian en lo posible, pero JavaScript no permite garantizar el borrado de cadenas ni de copias internas. No hay recuperación desde el servidor.

La página [z4sk.vercel.app/audit](https://z4sk.vercel.app/audit) reúne código y evidencia. [`/api/privacy-proof`](https://z4sk.vercel.app/api/privacy-proof) es una autoauditoría, no una certificación independiente.
