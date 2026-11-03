# Z4SK

[English](README.md) · [Español](README.es.md) · [Aplicación publicada](https://z4sk.vercel.app) · [Auditoría pública](https://z4sk.vercel.app/audit) · [CI](https://github.com/josejnet/z4sk/actions/workflows/ci.yml)

**Pregunta. Responde. Atrévete.** Z4SK es una aplicación móvil para crear cuestionarios privados. La persona creadora prepara una invitación, comparte el enlace público y consulta las respuestas cifradas desde un enlace secreto diferente.

![Página principal de Z4SK en español](docs/screenshots/home-es.png)

## Por qué Z4SK

- No requiere registro ni cuenta.
- Las invitaciones caducan a las 12, 24, 48 o 72 horas.
- El modo de lectura única elimina el grafo activo de la invitación antes de devolver la única copia del texto cifrado.
- Los nombres, preguntas, ajustes y la clave pública de respuestas se cifran en el navegador del creador con una llave de contenido aleatoria y AES-256-GCM.
- Las respuestas se cifran en el navegador del destinatario con ECDH P-256, HKDF-SHA-256 y AES-256-GCM.
- Cada invitación usa un secreto aleatorio de enlace de 256 bits. Opcionalmente puede añadirse una llave compartida reutilizable de 128 bits como QR con marca Z4SK o 12 palabras BIP39 en español; las llaves antiguas de 256 bits/24 palabras siguen siendo compatibles.
- El enlace completo abre una invitación sin llave. Si se activa la llave opcional, enlace y llave son necesarios y deben viajar por canales diferentes. El ID visible solo identifica la llave: no permite recuperarla ni abrirla.
- La clave privada de descifrado permanece en el fragmento del enlace secreto o en el QR privado; nunca se envía a la API.
- Cada destinatario recibe un enlace independiente para borrar su propia respuesta.
- El reto opcional de 30 segundos utiliza plazos absolutos, avance automático y no permite volver atrás.
- Incluye trece bibliotecas de idiomas y un modo legible por máquinas.

## Recorrido del producto

El constructor de cuatro pasos solicita únicamente la información necesaria para crear la invitación. El correo opcional permanece en el navegador y solo se utiliza para abrir la aplicación de correo del dispositivo.

![Constructor del cuestionario](docs/screenshots/builder-es.png)

El flujo principal es:

```text
Navegador del creador
  -> genera secreto de enlace, llave de contenido, token y par ECDH
  -> opcionalmente crea o escanea un QR de llave compartida reutilizable
  -> deriva una llave de envoltura del enlace y, si se activó, de la llave compartida
  -> cifra localmente nombres, preguntas, ajustes y clave pública
  -> envía texto cifrado, hash del token y política mínima
  -> comparte /g/:id#invite=<secreto-enlace> por el canal A
  -> si está protegida, comparte QR/12 palabras por el canal B

Navegador del destinatario
  -> abre directamente una invitación sin llave; en modo protegido lee el QR con cámara/Fotos o introduce 12 palabras
  -> descifra localmente la invitación
  -> cifra localmente toda la respuesta privada
  -> guarda el texto cifrado mediante POST /api/games/:id/responses

Navegador del creador
  -> abre /p/:id#key=<bearer>&invite=<secreto-enlace>&decrypt=<clave-privada>
  -> presenta la misma llave solo cuando se activó la protección adicional
  -> descarga invitación y respuestas cifradas usando el token bearer
  -> descifra ambas localmente
```

## Tecnología

- Next.js App Router, React y TypeScript
- Vercel Functions y Vercel Cron
- Neon Postgres mediante `@neondatabase/serverless`
- Web Crypto para cifrado autenticado en el cliente
- PWA instalable con una caché del service worker deliberadamente limitada
- Cliente reutilizable e independiente del framework en `packages/z4sk-sdk`

## Desarrollo local

Requisitos: Node.js 24 y una cadena de conexión de Neon/Postgres.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`. En desarrollo local, la clave del panel del fundador usa `dev-founder`; producción debe utilizar un `FOUNDER_DASHBOARD_KEY` largo y aleatorio.

## Verificación

El control habitual compila la aplicación, valida el HTML renderizado y audita las dependencias de producción:

```bash
npm run lint
npm test
npm audit
```

La verificación de staging exige una base independiente llamada `z4sk_staging_e2e`. Inicia la aplicación compilada contra ella y comprueba creación, cifrado, envíos concurrentes en lectura única, deduplicación de denuncias, privacidad de metadatos, descifrado, borrado por el destinatario y caducidad exacta:

```bash
npm run verify:e2e:staging
```

Guarda su conexión restringida en `Z4SK_STAGING_DATABASE_URL`, o utiliza un `DATABASE_URL` de desarrollo que apunte exactamente a esa base. El verificador rechaza cualquier otro nombre, incluido producción. Los cambios de esquema están versionados en `scripts/migrations.mjs` y se ejecutan con `npm run db:migrate` antes del despliegue.

## Privacidad, seguridad y auditoría pública

Para las nuevas invitaciones, Z4SK evita que el contenido legible de invitaciones y respuestas llegue a las APIs de creación/respuesta o a la base activa. No es anónimo: siguen visibles los identificadores aleatorios, número de preguntas, estado, caducidad, fechas, rutas y metadatos operativos de infraestructura.

**Trata cada enlace completo como una contraseña.** Puede abrir una invitación sin llave. Si el creador activa la llave opcional, envía su QR con marca o las 12 palabras por separado; entonces harán falta ambos secretos. El ID no es la llave y no permite recuperarla. El enlace del creador da acceso al panel y a las respuestas; en invitaciones protegidas también exige la llave opcional. Un navegador, dispositivo, extensión, despliegue, portapapeles, cámara o captura comprometidos aún pueden revelar el contenido.

- [Auditoría pública](https://z4sk.vercel.app/audit): protocolo, límites, código y evidencia en vivo.
- [Auditoría externa automatizada](docs/EXTERNAL_AUDIT.es.md): hallazgos de CodeQL, OWASP ZAP y OpenSSF, correcciones y riesgo residual.
- [Paquete de revisión humana](docs/HUMAN_SECURITY_REVIEW.es.md): alcance reproducible para una revisión criptográfica y un pentest independientes; no afirma que ya se hayan realizado.
- [Diseño criptográfico](docs/CRYPTOGRAPHY.md): algoritmos, payloads, datos visibles y amenazas.
- [Política de seguridad](SECURITY.md): notificación de vulnerabilidades y controles.
- [`/api/privacy-proof`](https://z4sk.vercel.app/api/privacy-proof): autoauditoría de ejecución en JSON.

El repositorio y la autoauditoría permiten inspeccionar el diseño; no son una certificación independiente ni una atestación remota de cada respuesta desplegada.

## Mapa del repositorio

| Ruta | Responsabilidad |
| --- | --- |
| `app/components/Builder.tsx` | Asistente de creación del cuestionario |
| `app/g/[id]` | Experiencia pública del destinatario |
| `app/p/[id]` | Panel secreto del creador |
| `app/cancel/[id]` | Borrado de la respuesta por su destinatario |
| `app/api` | APIs de invitaciones, respuestas, retención, métricas y patrocinio |
| `app/lib/response-crypto.ts` | Cifrado y descifrado en el navegador |
| `app/lib/shared-key.ts` | Generación de llave opcional, checksum QR, ID y conversión a 12 palabras, con compatibilidad de 24 |
| `app/components/SharedKeyUnlock.tsx` | Lector local de cámara, imagen o palabras |
| `app/lib/invitation-crypto.ts` | HKDF v2, envoltura de llave, AES-256-GCM e hidratación |
| `db/runtime.ts` | Consultas de ejecución y purgado de Neon |
| `scripts/migrations.mjs` | Migraciones versionadas previas al despliegue |
| `scripts/verify-e2ee.mjs` | Verificador completo del flujo cifrado |
| `packages/z4sk-sdk` | SDK reutilizable e independiente del framework |

## Despliegue

Los despliegues Git automáticos están desactivados. Cada push a `main` ejecuta el pipeline fijado de GitHub Actions, incluido el E2E cifrado sobre staging. Tras superar todas las comprobaciones, el job protegido de producción aplica las migraciones versionadas con una credencial exclusiva y llama a un Deploy Hook limitado a `main`. Las Functions usan otro rol de base de datos limitado a DML; si el nuevo build falla, Vercel mantiene activa la versión anterior.

```bash
gh workflow run ci.yml
```

Consulta [docs/DEPLOYMENT.es.md](docs/DEPLOYMENT.es.md) para configurar variables, revertir versiones y realizar comprobaciones posteriores al despliegue.

## Documentación adicional

- [Producto y modelo de crecimiento](docs/PRODUCT.md)
- [Arquitectura y modelo de datos](docs/ARCHITECTURE.md)
- [Despliegue y rollback en Vercel](docs/DEPLOYMENT.md)
- [Operaciones y respuesta a incidentes](docs/OPERATIONS.md)
- [Seguridad, privacidad y modelo de amenazas](SECURITY.md)
- [Auditoría externa automatizada de seguridad](docs/EXTERNAL_AUDIT.es.md)
- [Paquete para revisión humana de seguridad](docs/HUMAN_SECURITY_REVIEW.es.md)
- [Protocolo criptográfico y frontera de datos auditable](docs/CRYPTOGRAPHY.md)
- [Hoja de ruta comercial](docs/ROADMAP.md)
- [Marca y activación del dominio](docs/BRAND.md)
- [Registro de activos comercializables](SELLABLE_ASSETS.md)

## Estado del proyecto

Z4SK se encuentra en beta con código fuente público para su revisión por terceros. Los pagos, notificaciones push y la integración con WhatsApp Business continúan desactivados. El acceso del creador depende de conservar el enlace secreto y, si se activó, la llave opcional entregada por separado; deliberadamente no existe recuperación desde el servidor.

Actualmente no se concede ninguna licencia de código abierto. El repositorio y sus activos comerciales siguen siendo propietarios salvo que el titular publique una licencia independiente.
