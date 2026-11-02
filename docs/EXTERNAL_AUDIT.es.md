# Auditoría externa automatizada de seguridad — 1 de noviembre de 2026

[English](EXTERNAL_AUDIT.md) · [Política de seguridad](../SECURITY.md) · [Diseño criptográfico](CRYPTOGRAPHY.md) · [Autoauditoría en vivo](https://z4sk.vercel.app/audit)

## Resultado ejecutivo

**Aprobación condicionada.** Tras las correcciones, los analizadores automatizados independientes no encontraron vulnerabilidades conocidas en dependencias, secretos filtrados, hallazgos dinámicos de riesgo alto ni alertas de código CodeQL abiertas. La aplicación superó compilación, lint, pruebas unitarias/de renderizado, E2E cifrado en staging y la puerta de despliegue de producción.

Los hallazgos automatizados están corregidos o aceptados de forma explícita. `main` queda protegida y producción incorpora aprobación manual. Como el proyecto sigue teniendo un único mantenedor y el propietario conserva un bypass administrativo de emergencia, esto no equivale a una revisión humana independiente.

Es una evaluación con herramientas externas automatizadas, **no** un pentest humano, una certificación formal, un dictamen jurídico ni una prueba criptográfica.

## Alcance y evidencias

| Área | Control independiente | Evidencia |
| --- | --- | --- |
| SAST del código | GitHub CodeQL, `security-extended`, modelo de amenaza remoto | [Análisis corregido](https://github.com/josejnet/z4sk/actions/runs/41345217731) |
| DAST de producción | OWASP ZAP 2.17.0 pasivo contra `https://z4sk.vercel.app` | [Línea base](https://github.com/josejnet/z4sk/actions/runs/41344732440) · [análisis final](https://github.com/josejnet/z4sk/actions/runs/41359038546) |
| Cadena de suministro | OpenSSF Scorecard 2.5.0 | [Ejecución](https://github.com/josejnet/z4sk/actions/runs/41345217661) · [resultado público](https://scorecard.dev/viewer/?uri=github.com/josejnet/z4sk) |
| Dependencias | Base de avisos npm y GitHub Dependabot | `npm audit`: 0; alertas abiertas en GitHub: 0 |
| Secretos | GitHub secret scanning y protección al hacer push | alertas abiertas en GitHub: 0 |
| Controles en vivo | Comprobaciones públicas de base de datos y privacidad | [`/api/privacy-proof`](https://z4sk.vercel.app/api/privacy-proof) |

El DAST solo recorrió páginas públicas y descubrió activos/API públicos. No recibió enlaces de creador, claves de invitación o respuesta, tokens al portador, credenciales ni datos reales. No se ejecutó ningún ataque activo destructivo o autenticado.

## Hallazgos

| ID | Gravedad inicial | Estado | Hallazgo y resolución |
| --- | --- | --- | --- |
| EA-01 | Alerta alta del analizador | Resuelto / fuera de producción | CodeQL detectó cinco regex sin anclar y después tres búsquedas parciales de URL en pruebas. No eran lógica de autorización ni validación de URL. Ahora se comprueban orígenes HTTPS completos y el análisis final tiene 0 alertas CodeQL abiertas. |
| EA-02 | Media | Resuelto | Los atributos `style` dinámicos de React se sustituyeron por elementos `<progress>` semánticos y atributos SVG. Producción exige ahora `style-src` con nonce y `style-src-attr 'none'`; ZAP ya no detecta `style-src 'unsafe-inline'`. |
| EA-03 | Media | Resuelto | El rastreador encontró un 404 de `/api` sin CSP. Ahora devuelve JSON con `default-src 'none'`, `no-store` y `nosniff`. |
| EA-04 | Media | Falso positivo / aceptado | `Access-Control-Allow-Origin: *` aparece en fuentes públicas, manifest, `robots.txt` y `sitemap.xml`. No se encontró ninguna API privada o autenticada con CORS comodín; esos archivos no contienen datos confidenciales. |
| EA-05 | Baja | Resuelto | Se añadió `Cross-Origin-Embedder-Policy: require-corp` y se eliminó la cabecera `X-Powered-By`. |
| EA-06 | Baja | Falso positivo | ZAP indicó que faltaba HSTS en tres activos estáticos durante la primera pasada. Comprobaciones directas repetidas muestran `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` en HTML, API, iconos y service worker. |
| EA-07 | Informativa | Validado | ZAP marcó `lang` como potencialmente controlable. Solo se acepta si coincide exactamente con la lista cerrada `LOCALES` antes de modificar `document.documentElement.lang`. |
| EA-08 | Alta de cadena de suministro | Mitigada / bypass residual | `main` exige `verify`, firmas verificadas, historial lineal y actualizado, una aprobación, revisión del propietario del código y conversaciones resueltas; se bloquean borrado y force-push. Producción exige además aprobación del entorno de GitHub. El único propietario mantiene bypass administrativo para las demás reglas, por lo que un segundo revisor realmente independiente sigue siendo un requisito organizativo. |
| EA-09 | Endurecimiento del navegador | Implementado y monitorizado | La CSP aplicada informa de infracciones y Trusted Types funciona en modo informe. El endpoint propio descarta URL, identificadores, recursos bloqueados, archivos fuente, muestras e identificadores de red/usuario antes de guardar únicamente contadores diarios agregados. |

## Totales de analizadores

La primera pasada de OWASP ZAP produjo **0 tipos de alerta altos, 3 medios, 3 bajos y 13 informativos**. La pasada final dejó **0 altos, 1 medio, 1 bajo y 13 informativos**. El medio restante es el CORS de activos estáticos públicos de EA-04; el único bajo es la observación de HSTS refutada en EA-06.

OpenSSF Scorecard obtuvo **5,6/10**. Sus controles positivos fueron: cero vulnerabilidades conocidas, cero workflows peligrosos, dependencias fijadas, permisos mínimos en Actions, política de seguridad, ausencia de binarios versionados y actualización automática de dependencias. Reducen la nota la juventud del repositorio, su historial con un único mantenedor, la falta de protección de rama, revisión obligatoria, fuzzing, insignia OpenSSF y la ausencia deliberada de licencia abierta. Esas métricas de proceso no equivalen a vulnerabilidades explotables.

## Cambios aplicados durante la auditoría

- CodeQL configurado con consultas extendidas y amenaza remota;
- workflows programados y fijados por commit para OpenSSF Scorecard y OWASP ZAP;
- Dependabot semanal para npm y GitHub Actions;
- corrección de todos los avisos de CodeQL en pruebas;
- eliminación de `X-Powered-By`, incorporación de COEP y endurecimiento de `/api`;
- eliminación de todos los atributos `style` de React y sustitución del permiso CSS por `style-src` con nonce y `style-src-attr 'none'`;
- informes CSP con minimización, Trusted Types en modo informe y evidencia pública commit-despliegue;
- protección de `main`, firmas verificadas, propiedad del código y aprobación explícita del entorno de producción;
- publicación del alcance bilingüe para una revisión criptográfica y pentest humanos realmente independientes;
- verificación de `npm test`, `npm run lint`, `npm audit`, E2E cifrado y despliegue.

## Riesgo residual y siguiente paso

Las barreras técnicas de rama y publicación quedan implantadas. Lo pendiente no puede automatizarse con rigor: añadir un segundo mantenedor/revisor independiente, comprobar personalmente MFA en GitHub, Vercel, Neon y el dominio, registrar y respaldar una clave personal antes de crear commits locales, y contratar la revisión humana definida en [HUMAN_SECURITY_REVIEW.es.md](HUMAN_SECURITY_REVIEW.es.md).

El protocolo v2 hace que un enlace filtrado sea insuficiente sin la llave reutilizable compartida por separado. No protege si se filtran ambos canales, ni frente a dispositivo/navegador/extensión comprometidos, despliegue futuro malicioso, cámara/portapapeles, captura o texto copiado. Reutilizar una llave aumenta el impacto si también se filtran los secretos de los enlaces correspondientes. El nuevo protocolo necesita una revisión criptográfica humana independiente antes de presentarse como certificado externamente.

### Nota de cambio del protocolo v2 · 2 de noviembre de 2026

El protocolo de invitación de dos canales se añadió después de las pasadas externas resumidas arriba. La implementación supera localmente TypeScript, ESLint, build de producción, pruebas de políticas renderizadas y auditoría de dependencias, además de pruebas negativas con una llave compartida incorrecta y de ausencia de secretos en el servidor. Los resultados anteriores de CodeQL, Scorecard y ZAP **no** certifican por sí solos este nuevo diseño criptográfico. La próxima revisión independiente deberá cubrir la composición de entrada de HKDF, el envoltorio de claves, la representación BIP39/QR, la cámara móvil, la reutilización de llaves y la frontera de confianza navegador/despliegue descrita en [HUMAN_SECURITY_REVIEW.es.md](HUMAN_SECURITY_REVIEW.es.md).

## Reproducción

```bash
npm ci
npm run lint
npm test
npm audit
gh workflow run scorecard.yml
gh workflow run zap-baseline.yml
```

CodeQL, Scorecard y ZAP seguirán ejecutándose por calendario o eventos del repositorio. Los commits de Scorecard y ZAP están fijados en `.github/workflows`; CodeQL usa la configuración predeterminada gestionada por GitHub. Cualquier tercero puede revisar las ejecuciones y cambios de configuración.
