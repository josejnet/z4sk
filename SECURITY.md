# Security policy / Política de seguridad

[English](#english) · [Español](#español) · [Cryptographic design](docs/CRYPTOGRAPHY.md) · [External automated audit](docs/EXTERNAL_AUDIT.md) · [Live self-audit](https://z4sk.vercel.app/audit)

## English

### Reporting a vulnerability

Report vulnerabilities privately through [GitHub private vulnerability reporting](https://github.com/josejnet/z4sk/security/advisories/new). Do not open a public issue and never include invitation links, answers, credentials or personal data in a report. The repository is public so that the implementation can be inspected; that does not make a real invitation safe to publish.

### Security model

- The creator browser uses Web Crypto to generate a random 256-bit link secret, a random 256-bit content key, a random 192-bit API token and an ECDH P-256 response key pair.
- A second, reusable 256-bit shared key is generated locally or imported by scanning its QR. It can also be reconstructed from 24 Spanish BIP39 words. The QR and words are the same key, not separate factors.
- HKDF-SHA-256 combines link secret and shared key. AES-256-GCM wraps the random content key and encrypts names, questions, settings and the response public key before creation. The server stores only the authenticated v2 envelope and minimal metadata.
- Only the link secret is stored in `#invite=`. The shared key is never sent in a URL, API request, API response or database row. URL fragments are not sent as part of ordinary HTTP requests.
- The recipient scans the shared-key QR with the camera, reads a local image, or enters the 24 words. All decoding and invitation decryption occur locally. The browser then encrypts the response with ephemeral ECDH P-256, HKDF-SHA-256 and AES-256-GCM.
- The creator dashboard link additionally contains the API token and the response private key. Postgres stores only the token's SHA-256 hash and never receives either decryption secret.
- Response and private-dashboard APIs use `Cache-Control: no-store`. Application code does not log request bodies, authorization headers, URL fragments or decrypted content.
- Enforced CSP violations and Trusted Types compatibility reports are reduced to daily counters by directive, coarse route class and disposition. Full URLs, identifiers, blocked resources, source files, code samples and user/network identifiers are discarded before storage.
- New public identifiers contain 128 random bits. Creator and recipient-deletion secrets contain 192 random bits.
- Rate-limit and event pseudonyms use HMAC-SHA-256 with a server-only secret and rotation. Raw IP addresses are not stored by application code.
- The public [`/api/privacy-proof`](https://z4sk.vercel.app/api/privacy-proof) endpoint checks the active schema and data for plaintext leakage, malformed envelopes, weak identifiers, expiry backlog and required production controls.

> **Two channels are required.** Treat the link as the first half of access and the reusable shared key as the second. Never send them together. A link by itself cannot decrypt, but anyone who obtains both can. A creator link plus that key can also open the dashboard and decrypt responses.

### What the server can still see

End-to-end encryption does not hide everything. The server and infrastructure can see the random invitation ID, creation/open/submission/expiry timestamps, state, question count, view-once policy, request paths, approximate country and operational network metadata. Vercel transiently processes the creator bearer token in an authorization header. Provider recovery history may temporarily retain ciphertext. See [the exact data map and trust boundaries](docs/CRYPTOGRAPHY.md).

### Threats outside this design

- anyone holding both a link and its shared key has the corresponding capability;
- reusing one shared key is convenient but increases the impact of its compromise across invitations whose link secrets are also obtained; rotate it after suspected exposure;
- a compromised or malicious browser, extension, device, clipboard, screenshot or future application build can expose plaintext;
- encryption cannot erase content already seen, remembered, copied or photographed;
- URL fragments can still leak through the user, clipboard history, browser sync, messaging backups or screenshots even though they are not sent in HTTP requests;
- there is deliberately no server-side link or shared-key recovery; losing either means losing access;
- JavaScript byte buffers are cleared best-effort, but browser memory and immutable strings cannot be guaranteed erased;
- the public code and live self-audit improve inspectability, but are not an independent security certification and do not prove that every production response was produced by an unmodified build.

### Production controls

- Keep `FOUNDER_DASHBOARD_KEY`, `RATE_LIMIT_HMAC_SECRET`, database credentials and deployment credentials only in protected platform secrets.
- Require MFA for GitHub, Vercel, Neon and domain accounts; enable secret scanning, dependency alerts and protected branches where available.
- Do not add analytics, session replay, advertising SDKs or remote scripts to `/g/*`, `/p/*`, `/cancel/*` or private API flows.
- Keep exact expiry checks on every access path, daily purge, atomic view-once consumption and the database single-response constraint.
- Run `npm run lint`, `npm test`, `npm audit` and `npm run verify:e2e:staging` before promotion.
- Monitor `/api/privacy-proof`; investigate an old purge heartbeat or any failed plaintext/envelope check.
- Compare the production commit in `/audit` and `/api/privacy-proof` with the public repository before reviewing a deployment. Use the [human review packet](docs/HUMAN_SECURITY_REVIEW.md) for an independent cryptographic review or pentest.

Account-level MFA for GitHub, Vercel, Neon and the domain registrar must be verified by the account holder in each provider. It cannot be proved or enabled by repository code. `main` requires GitHub-verified commit signatures: local authors must register and safely back up a GPG or SSH signing key, or merge through GitHub using its verified web-flow signature.

## Español

### Notificación de vulnerabilidades

Comunica vulnerabilidades mediante los [avisos privados de seguridad de GitHub](https://github.com/josejnet/z4sk/security/advisories/new). No abras una incidencia pública ni incluyas enlaces reales, respuestas, credenciales o datos personales. El repositorio es público para permitir la revisión del código, no para publicar secretos de usuarios.

### Resumen verificable

- El navegador genera un secreto de enlace de 256 bits, una llave de contenido de 256 bits, un token y el par ECDH mediante Web Crypto.
- El creador genera o escanea una llave compartida reutilizable de 256 bits. El QR y sus 24 palabras BIP39 españolas son dos representaciones de esa misma llave, no dos factores.
- HKDF-SHA-256 combina secreto de enlace y llave compartida. AES-256-GCM envuelve la llave de contenido y cifra nombres, preguntas, ajustes y clave pública antes de enviar nada.
- Solo el secreto del enlace vive en `#invite=`. La llave compartida nunca se incluye en URL, petición, respuesta de API o base de datos.
- El destinatario escanea el QR con la cámara, lee una imagen local o introduce las 24 palabras. Todo se procesa localmente antes de cifrar la respuesta con ECDH P-256, HKDF-SHA-256 y AES-256-GCM.
- El enlace privado del creador añade un token de acceso y la única clave privada capaz de descifrar respuestas. La base de datos guarda únicamente el hash SHA-256 del token.
- El servidor conserva texto cifrado y metadatos operativos mínimos: identificador aleatorio, fechas, estado, número de preguntas y política de lectura única/caducidad.
- Los informes CSP y de compatibilidad Trusted Types se reducen antes de guardarse a contadores diarios por directiva y clase de ruta; se descartan URL, identificadores, recursos bloqueados, archivos fuente, muestras de código e identificadores de red.
- La [auditoría pública en vivo](https://z4sk.vercel.app/audit) explica el diseño y enlaza las comprobaciones de la base activa.

> **Se necesitan dos canales.** Trata el enlace como la primera mitad del acceso y la llave compartida como la segunda. No los envíes juntos. El enlace solo no descifra, pero quien consiga ambos podrá hacerlo; con el enlace del creador y la llave también podrá abrir el panel.

El cifrado no protege frente a un navegador o despliegue malicioso, extensiones, malware, capturas de pantalla, portapapeles, copias realizadas por otra persona ni filtraciones del enlace. Tampoco convierte el servicio en anónimo: la infraestructura sigue tratando metadatos de red, rutas y fechas. Consulta [docs/CRYPTOGRAPHY.md](docs/CRYPTOGRAPHY.md) para el protocolo completo, los límites y las propiedades comprobables.

La activación y comprobación de MFA en GitHub, Vercel, Neon y el registrador del dominio requiere al titular de cada cuenta y no puede demostrarse desde el código. `main` exige firmas verificadas por GitHub: los commits locales necesitan una clave GPG o SSH registrada y respaldada; como alternativa, GitHub firma su propio squash/merge verificado. El [paquete de revisión humana](docs/HUMAN_SECURITY_REVIEW.es.md) fija el alcance pendiente para un pentest o revisión criptográfica realmente independiente.

## Supported versions / Versiones compatibles

Only the current production commit on `main` is supported during beta. Solo se mantiene la versión de producción actual de `main` durante la beta.
