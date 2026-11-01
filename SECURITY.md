# Security policy / Política de seguridad

[English](#english) · [Español](#español) · [Cryptographic design](docs/CRYPTOGRAPHY.md) · [Live self-audit](https://z4sk.vercel.app/audit)

## English

### Reporting a vulnerability

Report vulnerabilities privately through [GitHub private vulnerability reporting](https://github.com/josejnet/z4sk/security/advisories/new). Do not open a public issue and never include invitation links, answers, credentials or personal data in a report. The repository is public so that the implementation can be inspected; that does not make a real invitation safe to publish.

### Security model

- The creator browser generates a random 256-bit invitation key, a random 192-bit API token and an ECDH P-256 response key pair using Web Crypto.
- Creator/recipient display names, title, questions, locale, level, feature settings and the response public key are encrypted in the creator browser with AES-256-GCM before creation. The server stores the authenticated ciphertext envelope and the question count, not those fields in plaintext.
- The invitation key is stored only in the `#invite=` URL fragment of both user-held links. URL fragments are not sent as part of HTTP requests.
- The recipient browser decrypts the invitation locally. It then encrypts respondent name, written answers, reactions and match choice with an ephemeral ECDH P-256 key, HKDF-SHA-256 and AES-256-GCM before submission.
- The creator dashboard link additionally contains the API token and the response private key. Postgres stores only the token's SHA-256 hash and never receives either decryption secret.
- Response and private-dashboard APIs use `Cache-Control: no-store`. Application code does not log request bodies, authorization headers, URL fragments or decrypted content.
- New public identifiers contain 128 random bits. Creator and recipient-deletion secrets contain 192 random bits.
- Rate-limit and event pseudonyms use HMAC-SHA-256 with a server-only secret and rotation. Raw IP addresses are not stored by application code.
- The public [`/api/privacy-proof`](https://z4sk.vercel.app/api/privacy-proof) endpoint checks the active schema and data for plaintext leakage, malformed envelopes, weak identifiers, expiry backlog and required production controls.

> **A complete invitation link is a password-equivalent bearer secret.** Anyone who receives it can decrypt the invitation and submit until expiry. A complete creator link is even more sensitive because it can also authorize the dashboard and decrypt responses. Never post either link publicly.

### What the server can still see

End-to-end encryption does not hide everything. The server and infrastructure can see the random invitation ID, creation/open/submission/expiry timestamps, state, question count, view-once policy, request paths, approximate country and operational network metadata. Vercel transiently processes the creator bearer token in an authorization header. Provider recovery history may temporarily retain ciphertext. See [the exact data map and trust boundaries](docs/CRYPTOGRAPHY.md).

### Threats outside this design

- anyone holding a complete invitation or creator link has the corresponding capability;
- a compromised or malicious browser, extension, device, clipboard, screenshot or future application build can expose plaintext;
- encryption cannot erase content already seen, remembered, copied or photographed;
- URL fragments can still leak through the user, clipboard history, browser sync, messaging backups or screenshots even though they are not sent in HTTP requests;
- there is deliberately no creator-link recovery; losing the link means losing access;
- the public code and live self-audit improve inspectability, but are not an independent security certification and do not prove that every production response was produced by an unmodified build.

### Production controls

- Keep `FOUNDER_DASHBOARD_KEY`, `RATE_LIMIT_HMAC_SECRET`, database credentials and deployment credentials only in protected platform secrets.
- Require MFA for GitHub, Vercel, Neon and domain accounts; enable secret scanning, dependency alerts and protected branches where available.
- Do not add analytics, session replay, advertising SDKs or remote scripts to `/g/*`, `/p/*`, `/cancel/*` or private API flows.
- Keep exact expiry checks on every access path, daily purge, atomic view-once consumption and the database single-response constraint.
- Run `npm run lint`, `npm test`, `npm audit` and `npm run verify:e2e:staging` before promotion.
- Monitor `/api/privacy-proof`; investigate an old purge heartbeat or any failed plaintext/envelope check.

## Español

### Notificación de vulnerabilidades

Comunica vulnerabilidades mediante los [avisos privados de seguridad de GitHub](https://github.com/josejnet/z4sk/security/advisories/new). No abras una incidencia pública ni incluyas enlaces reales, respuestas, credenciales o datos personales. El repositorio es público para permitir la revisión del código, no para publicar secretos de usuarios.

### Resumen verificable

- El navegador del creador cifra con AES-256-GCM los nombres, preguntas, ajustes y la clave pública de respuestas antes de crear la invitación.
- La clave de la invitación solo vive en el fragmento `#invite=` de los enlaces que conservan los usuarios; no se envía en la petición HTTP.
- El navegador del destinatario descifra la invitación localmente y cifra la respuesta con ECDH P-256, HKDF-SHA-256 y AES-256-GCM antes de enviarla.
- El enlace privado del creador añade un token de acceso y la única clave privada capaz de descifrar respuestas. La base de datos guarda únicamente el hash SHA-256 del token.
- El servidor conserva texto cifrado y metadatos operativos mínimos: identificador aleatorio, fechas, estado, número de preguntas y política de lectura única/caducidad.
- La [auditoría pública en vivo](https://z4sk.vercel.app/audit) explica el diseño y enlaza las comprobaciones de la base activa.

> **Compartir el enlace completo equivale a compartir una contraseña.** Quien tenga el enlace de la invitación puede descifrarla y responder mientras siga activa. Quien tenga el enlace del creador puede además abrir el panel y descifrar respuestas.

El cifrado no protege frente a un navegador o despliegue malicioso, extensiones, malware, capturas de pantalla, portapapeles, copias realizadas por otra persona ni filtraciones del enlace. Tampoco convierte el servicio en anónimo: la infraestructura sigue tratando metadatos de red, rutas y fechas. Consulta [docs/CRYPTOGRAPHY.md](docs/CRYPTOGRAPHY.md) para el protocolo completo, los límites y las propiedades comprobables.

## Supported versions / Versiones compatibles

Only the current production commit on `main` is supported during beta. Solo se mantiene la versión de producción actual de `main` durante la beta.
