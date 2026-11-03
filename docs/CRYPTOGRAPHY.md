# Cryptographic design / Diseño criptográfico

[English](#english) · [Español](#español) · [Security policy](../SECURITY.md) · [Live audit](https://z4sk.vercel.app/audit) · [Machine-readable proof](https://z4sk.vercel.app/api/privacy-proof)

## English

### Scope and security goal

Z4SK encrypts invitation and response content in the browsers. A database disclosure should expose authenticated ciphertext and operational metadata, not display names, questions, settings, respondent names or answers.

Every new invitation uses a **256-bit random link secret** in the URL fragment. A creator may optionally add a **128-bit reusable shared key** represented by a branded Z4SK QR or the equivalent 12-word Spanish BIP39 recovery phrase. Legacy 256-bit/24-word shared keys remain accepted.

A complete link decrypts a link-only invitation. In shared-key mode, both link and shared key are required. The shared key is never placed in a URL, request, API response or database row. It is scanned with the camera, read from a local image in Photos, or entered as a 12-word recovery phrase. QR and phrase are two representations of the same key, not two factors. The displayed key ID is a non-secret identifier; it cannot recover or unlock the key.

> Treat every complete invitation or creator link like a password. If the optional shared key is enabled, send it through a different channel. Anyone who obtains the complete link can open link-only mode; anyone who obtains both secrets can open protected mode. The creator link additionally authorizes the dashboard and carries the response private key.

### Protocol

```mermaid
sequenceDiagram
  participant C as Creator browser
  participant A as Z4SK API
  participant D as Neon Postgres
  participant R as Recipient browser

  C->>C: Generate link secret, content key, token and ECDH P-256 pair
  C->>C: Optionally create or scan reusable shared key
  C->>C: HKDF(link secret [|| shared key]) -> wrapping key
  C->>C: AES-256-GCM wrap content key; encrypt invitation with content key
  C->>A: v2 ciphertext envelope + SHA-256(token) + policy + question count
  A->>D: Store ciphertext and minimal operational metadata
  C-->>R: Complete link through channel A
  opt Shared-key mode
    C-->>R: Branded key QR/12-word recovery phrase through channel B
  end
  R->>A: GET /api/games/:id
  A-->>R: ciphertext + state + expiry
  R->>R: Use link alone or combine it with optional key; decrypt locally
  R->>R: Ephemeral ECDH + HKDF-SHA-256 + AES-256-GCM encrypt response
  R->>A: response ciphertext envelope
  C->>A: Authorization: Bearer token
  A-->>C: invitation and response ciphertext
  C->>C: If protected, present same shared key; decrypt locally
```

### Invitation envelope v2

- Randomness: Web Crypto `crypto.getRandomValues` creates each 32-byte link and content key, optional new 16-byte shared key, 32-byte HKDF salt and 12-byte AES-GCM IV.
- Derivation: link-only mode uses HKDF-SHA-256 with input key material `link_secret` and info `z4sk-invitation-key-v2-link-only`. Shared-key mode uses `link_secret || shared_key` and info `z4sk-invitation-key-v2`. Domain separation prevents accidental cross-mode key equivalence.
- Key wrapping: AES-256-GCM encrypts the random content key with AAD matching the selected versioned mode context.
- Content encryption: AES-256-GCM encrypts the invitation payload with the content key and AAD `z4sk-invitation-content-v2`.
- Envelope: `{v:2, alg, keyMode, salt, keyIv, wrappedKey, iv, ciphertext}`. Missing `keyMode` is interpreted as shared-key mode only for legacy v2 compatibility.
- Payload: creator/recipient display names, title, locale, level, questions, feature settings, pack, library version, creation time and the response ECDH public key.
- Link transport: only the link secret is base64url encoded in `#invite=`. URL fragments are not included in ordinary HTTP navigation requests.
- Shared-key transport: the QR payload is `Z4SK-KEY-V1:<key>:<context-checksum>` and is exported inside a branded Z4SK card. New keys are 16 bytes and their 12 Spanish BIP39 words encode the same 128 bits plus checksum. Legacy 32-byte/24-word keys remain accepted. These words are not a user-chosen passphrase or a cryptocurrency wallet seed and must never be imported into a wallet.

The context checksum detects scanning/transcription mistakes; it is not an authentication factor. The QR may be reused for one trusted person, but reusing it links the risk of all invitations protected by it: rotate it after suspected exposure.

### Response envelope

- Key agreement: creator static ECDH P-256 public key and recipient ephemeral ECDH P-256 private key.
- Derivation: HKDF-SHA-256 with a random salt and versioned context.
- Encryption: AES-256-GCM with a fresh 12-byte IV.
- Content: respondent display name, answers and reactions.
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
| Response | ciphertext envelope, invitation ID, submission time, single-use state | respondent name, answers and reactions |
| Authorization | token hashes; raw bearer token processed transiently | link secret, shared key, content key and response private key are not stored |
| Operations | reason category, approximate country, rate-limit HMAC, request paths and provider metadata | application code does not log bodies, URL fragments or decrypted content |

### Trust boundaries and limitations

- A complete link is sufficient in link-only mode and must remain private. Shared-key mode additionally requires the optional key.
- Anyone obtaining the required bearer secret or secrets can decrypt. The server cannot recover or distinguish a copied shared key.
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

Cada invitación nueva utiliza un **secreto aleatorio de enlace de 256 bits** en el fragmento de URL. El creador puede añadir opcionalmente una **llave compartida reutilizable de 128 bits**, representada por un QR con marca Z4SK o por 12 palabras BIP39 en español. Las llaves antiguas de 256 bits/24 palabras siguen siendo válidas.

El enlace completo descifra una invitación sin llave. En modo protegido hacen falta enlace y llave. La llave nunca se añade a la URL, petición, respuesta de API o base de datos. Se lee con la cámara, desde una imagen local de Fotos o introduciendo las 12 palabras. QR y palabras son dos formatos de la misma llave, no dos factores. El ID visible no es secreto: solo identifica la llave y no permite recuperarla ni abrirla.

> Trata cada enlace completo de invitación o creador como una contraseña. Si activas la llave opcional, envíala por otro canal. Quien consiga el enlace completo podrá abrir el modo sin llave; quien consiga ambos secretos podrá abrir el modo protegido. El enlace del creador añade la autorización del panel y la clave privada de respuestas.

### Flujo resumido

1. El navegador crea el secreto del enlace, una llave de contenido, un token y el par ECDH de respuestas.
2. El creador puede generar una llave compartida opcional o escanear el QR fijo que ya usa con esa persona.
3. HKDF-SHA-256 usa `secreto_enlace` o, en modo protegido, `secreto_enlace || llave_compartida`, con contextos distintos y sal aleatoria.
4. AES-256-GCM envuelve la llave de contenido y cifra la invitación con contextos autenticados distintos.
5. La API recibe el sobre v2 cifrado, el hash del token y los metadatos mínimos.
6. El destinatario abre el enlace directamente o, en modo protegido, recibe QR/palabras por otro canal y combina ambos localmente.
7. La respuesta se cifra en el navegador con ECDH P-256, HKDF-SHA-256 y AES-256-GCM.
8. En modo protegido, el creador vuelve a presentar la llave compartida para abrir la invitación y sus respuestas en el panel.

### Aleatoriedad y formato recuperable

Las llaves nuevas de 16 bytes se generan con `crypto.getRandomValues` de Web Crypto. Las 12 palabras españolas codifican exactamente los 128 bits de la llave y la suma de comprobación BIP39. Se admiten llaves antiguas de 32 bytes/24 palabras. No son una contraseña elegida por una persona ni una semilla de monedero, y no deben importarse jamás en una cartera de criptomonedas.

El QR fijo incluye un prefijo de versión y una suma de comprobación contextual. Se descarga dentro de una tarjeta con marca Z4SK y puede leerse desde la cámara o Fotos en el mismo móvil. El ID visible permite comparar copias, pero no recupera ni abre la llave. Reutilizar una llave con la misma persona es posible, pero aumenta el impacto de una filtración: conviene usar una por persona y sustituirla si hay cualquier duda.

### Límites honestos

El servidor sigue viendo identificadores aleatorios, fechas, estado, caducidad, número de preguntas, rutas y metadatos de red. Un atacante con el enlace completo puede descifrar el modo sin llave; en modo protegido necesita además la llave opcional. También pueden revelar el contenido un navegador, dispositivo, extensión o despliegue malicioso, el portapapeles, una captura o la propia persona que ya ha visto el texto.

Los secretos y el texto legible permanecen temporalmente en la memoria del navegador mientras se usan. Los buffers binarios se limpian en lo posible, pero JavaScript no permite garantizar el borrado de cadenas ni de copias internas. No hay recuperación desde el servidor.

La página [z4sk.vercel.app/audit](https://z4sk.vercel.app/audit) reúne código y evidencia. [`/api/privacy-proof`](https://z4sk.vercel.app/api/privacy-proof) es una autoauditoría, no una certificación independiente.
