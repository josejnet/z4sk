# Security policy / Política de seguridad

[English](#english) · [Español](#español) · [Cryptographic design](docs/CRYPTOGRAPHY.md) · [External automated audit](docs/EXTERNAL_AUDIT.md) · [Live self-audit](https://z4sk.vercel.app/audit)

## English

### Reporting a vulnerability

Report vulnerabilities privately through [GitHub private vulnerability reporting](https://github.com/josejnet/z4sk/security/advisories/new). Do not open a public issue and never include invitation links, answers, credentials or personal data in a report. The repository is public so that the implementation can be inspected; that does not make a real invitation safe to publish.

### Security model

- The creator browser uses Web Crypto to generate a random 256-bit link secret, a random 256-bit content key, independent random 192-bit creator and response-submission tokens, and an ECDH P-256 response key pair. The API stores only token hashes.
- An optional reusable 128-bit shared key can be generated locally or imported from its branded QR. It can also be reconstructed from its 12-word Spanish BIP39 recovery phrase; legacy 256-bit/24-word keys remain accepted. The QR and phrase are the same key, not separate factors, and the visible key ID is only an identifier.
- HKDF-SHA-256 uses the link secret alone in link-only mode, or link secret plus shared key in protected mode, with domain-separated contexts. AES-256-GCM wraps the random content key and encrypts names, questions, settings and the response public key before creation. The server stores only the authenticated v2 envelope and minimal metadata.
- Only the link secret is stored in `#invite=`. The shared key is never sent in a URL, API request, API response or database row. URL fragments are not sent as part of ordinary HTTP requests.
- For protected invitations, the recipient scans the shared-key QR with the camera, selects it from Photos on the same phone, or enters the 12-word recovery phrase. All decoding and invitation decryption occur locally. Link-only invitations open with the complete link. The browser then encrypts the response with ephemeral ECDH P-256, HKDF-SHA-256 and AES-256-GCM.
- The creator dashboard link additionally contains the API token and the response private key. Postgres stores only the token's SHA-256 hash and never receives either decryption secret.
- Response and private-dashboard APIs use `Cache-Control: no-store`. Application code does not log request bodies, authorization headers, URL fragments or decrypted content.
- Enforced CSP violations and Trusted Types compatibility reports are reduced to daily counters by directive, coarse route class and disposition. Full URLs, identifiers, blocked resources, source files, code samples and user/network identifiers are discarded before storage.
- New public identifiers contain 128 random bits. Creator and recipient-deletion secrets contain 192 random bits.
- Rate-limit and event pseudonyms use HMAC-SHA-256 with a server-only secret and rotation. Raw IP addresses are not stored by application code.
- The public [`/api/privacy-proof`](https://z4sk.vercel.app/api/privacy-proof) endpoint checks the active schema and data for plaintext leakage, malformed envelopes, weak identifiers, expiry backlog and required production controls.

> **A complete link is a bearer secret.** It opens a link-only invitation. If the optional shared key is enabled, send it through a second channel; link and key are then both required. A creator link additionally authorizes the dashboard and carries the response private key.

### What the server can still see

End-to-end encryption does not hide everything. The server and infrastructure can see the random invitation ID, creation/open/submission/expiry timestamps, state, question count, view-once policy, request paths, approximate country and operational network metadata. Vercel transiently processes the creator bearer token in an authorization header. Provider recovery history may temporarily retain ciphertext. See [the exact data map and trust boundaries](docs/CRYPTOGRAPHY.md).

### Threats outside this design

- anyone holding the complete link has the link-only capability; protected invitations additionally require their shared key;
- reusing one shared key is convenient but increases the impact of its compromise across invitations whose link secrets are also obtained; rotate it after suspected exposure;
- a compromised or malicious browser, extension, device, clipboard, screenshot or future application build can expose plaintext;
- encryption cannot erase content already seen, remembered, copied or photographed;
- URL fragments can still leak through the user, clipboard history, browser sync, messaging backups or screenshots even though they are not sent in HTTP requests;
- there is deliberately no server-side link or shared-key recovery; losing a required secret means losing access;
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

- El navegador genera mediante Web Crypto un secreto de enlace de 256 bits, una llave de contenido de 256 bits, tokens independientes de 192 bits para creador y envío de respuestas, y el par ECDH. La API solo guarda sus hashes.
- El creador puede generar o escanear una llave compartida opcional de 128 bits. El QR con marca y su frase de recuperación de 12 palabras BIP39 españolas son dos representaciones de esa misma llave, no dos factores; se conservan las llaves antiguas de 256 bits/24 palabras. El ID visible solo identifica la llave.
- HKDF-SHA-256 usa el secreto de enlace en modo simple o lo combina con la llave compartida en modo protegido, con contextos separados. AES-256-GCM envuelve la llave de contenido y cifra nombres, preguntas, ajustes y clave pública antes de enviar nada.
- Solo el secreto del enlace vive en `#invite=`. La llave compartida nunca se incluye en URL, petición, respuesta de API o base de datos.
- En modo protegido, el destinatario escanea el QR con la cámara, lo elige desde Fotos en el mismo móvil o introduce la frase de recuperación de 12 palabras. Todo se procesa localmente. En modo simple basta el enlace completo. La respuesta se cifra con ECDH P-256, HKDF-SHA-256 y AES-256-GCM.
- El enlace privado del creador añade un token de acceso y la única clave privada capaz de descifrar respuestas. La base de datos guarda únicamente el hash SHA-256 del token.
- El servidor conserva texto cifrado y metadatos operativos mínimos: identificador aleatorio, fechas, estado, número de preguntas y política de lectura única/caducidad.
- Los informes CSP y de compatibilidad Trusted Types se reducen antes de guardarse a contadores diarios por directiva y clase de ruta; se descartan URL, identificadores, recursos bloqueados, archivos fuente, muestras de código e identificadores de red.
- La [auditoría pública en vivo](https://z4sk.vercel.app/audit) explica el diseño y enlaza las comprobaciones de la base activa.

> **El enlace completo es un secreto al portador.** Abre una invitación sin llave. Si activas la llave opcional, envíala por un segundo canal: entonces harán falta ambos. El enlace del creador añade autorización del panel y la clave privada de respuestas.

El cifrado no protege frente a un navegador o despliegue malicioso, extensiones, malware, capturas de pantalla, portapapeles, copias realizadas por otra persona ni filtraciones del enlace. Tampoco convierte el servicio en anónimo: la infraestructura sigue tratando metadatos de red, rutas y fechas. Consulta [docs/CRYPTOGRAPHY.md](docs/CRYPTOGRAPHY.md) para el protocolo completo, los límites y las propiedades comprobables.

La activación y comprobación de MFA en GitHub, Vercel, Neon y el registrador del dominio requiere al titular de cada cuenta y no puede demostrarse desde el código. `main` exige firmas verificadas por GitHub: los commits locales necesitan una clave GPG o SSH registrada y respaldada; como alternativa, GitHub firma su propio squash/merge verificado. El [paquete de revisión humana](docs/HUMAN_SECURITY_REVIEW.es.md) fija el alcance pendiente para un pentest o revisión criptográfica realmente independiente.

## Supported versions / Versiones compatibles

Only the current production commit on `main` is supported during beta. Solo se mantiene la versión de producción actual de `main` durante la beta.
