# Auditoría externa automatizada de seguridad — 1 de noviembre de 2026

[English](EXTERNAL_AUDIT.md) · [Política de seguridad](../SECURITY.md) · [Diseño criptográfico](CRYPTOGRAPHY.md) · [Autoauditoría en vivo](https://z4sk.vercel.app/audit)

## Resultado ejecutivo

**Aprobación condicionada.** Tras las correcciones, los analizadores automatizados independientes no encontraron vulnerabilidades conocidas en dependencias, secretos filtrados, hallazgos dinámicos de riesgo alto ni alertas de código CodeQL abiertas. La aplicación superó compilación, lint, pruebas unitarias/de renderizado, E2E cifrado en staging y la puerta de despliegue de producción.

Se mantienen visibles dos mejoras relevantes:

1. la CSP de producción todavía permite CSS en línea mediante `style-src 'unsafe-inline'`; los scripts en línea siguen prohibidos y cada script necesita un nonce por petición;
2. la rama `main` no está protegida y el repositorio todavía no obliga a una revisión independiente mediante pull request.

Es una evaluación con herramientas externas automatizadas, **no** un pentest humano, una certificación formal, un dictamen jurídico ni una prueba criptográfica.

## Alcance y evidencias

| Área | Control independiente | Evidencia |
| --- | --- | --- |
| SAST del código | GitHub CodeQL, `security-extended`, modelo de amenaza remoto | [Análisis corregido](https://github.com/josejnet/z4sk/actions/runs/41345217731) |
| DAST de producción | OWASP ZAP 2.17.0 pasivo contra `https://z4sk.vercel.app` | [Línea base](https://github.com/josejnet/z4sk/actions/runs/41344732440) · [análisis posterior](https://github.com/josejnet/z4sk/actions/runs/41345356462) |
| Cadena de suministro | OpenSSF Scorecard 2.5.0 | [Ejecución](https://github.com/josejnet/z4sk/actions/runs/41345217661) · [resultado público](https://scorecard.dev/viewer/?uri=github.com/josejnet/z4sk) |
| Dependencias | Base de avisos npm y GitHub Dependabot | `npm audit`: 0; alertas abiertas en GitHub: 0 |
| Secretos | GitHub secret scanning y protección al hacer push | alertas abiertas en GitHub: 0 |
| Controles en vivo | Comprobaciones públicas de base de datos y privacidad | [`/api/privacy-proof`](https://z4sk.vercel.app/api/privacy-proof) |

El DAST solo recorrió páginas públicas y descubrió activos/API públicos. No recibió enlaces de creador, claves de invitación o respuesta, tokens al portador, credenciales ni datos reales. No se ejecutó ningún ataque activo destructivo o autenticado.

## Hallazgos

| ID | Gravedad inicial | Estado | Hallazgo y resolución |
| --- | --- | --- | --- |
| EA-01 | Alerta alta del analizador | Resuelto / fuera de producción | CodeQL detectó cinco regex sin anclar y después tres búsquedas parciales de URL en pruebas. No eran lógica de autorización ni validación de URL. Ahora se comprueban orígenes HTTPS completos y el análisis final tiene 0 alertas CodeQL abiertas. |
| EA-02 | Media | Abierta, endurecimiento aceptado | ZAP detectó `style-src 'unsafe-inline'`. Afecta solo a CSS; siguen activos `script-src-attr 'none'` y `script-src` con nonce. Eliminarlo con seguridad exige refactorizar los atributos de estilo dinámicos y probar todas las rutas. |
| EA-03 | Media | Resuelto | El rastreador encontró un 404 de `/api` sin CSP. Ahora devuelve JSON con `default-src 'none'`, `no-store` y `nosniff`. |
| EA-04 | Media | Falso positivo / aceptado | `Access-Control-Allow-Origin: *` aparece en fuentes públicas, manifest, `robots.txt` y `sitemap.xml`. No se encontró ninguna API privada o autenticada con CORS comodín; esos archivos no contienen datos confidenciales. |
| EA-05 | Baja | Resuelto | Se añadió `Cross-Origin-Embedder-Policy: require-corp` y se eliminó la cabecera `X-Powered-By`. |
| EA-06 | Baja | Falso positivo | ZAP indicó que faltaba HSTS en tres activos estáticos durante la primera pasada. Comprobaciones directas repetidas muestran `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` en HTML, API, iconos y service worker. |
| EA-07 | Informativa | Validado | ZAP marcó `lang` como potencialmente controlable. Solo se acepta si coincide exactamente con la lista cerrada `LOCALES` antes de modificar `document.documentElement.lang`. |
| EA-08 | Alta de cadena de suministro | Abierta | No hay protección de `main` ni revisión obligatoria por pull request. No expone por sí misma el texto de usuarios, pero reduce la prevención ante un cambio de producción erróneo o no autorizado. |

## Totales de analizadores

La primera pasada de OWASP ZAP produjo **0 tipos de alerta altos, 3 medios, 3 bajos y 13 informativos**. Después de las correcciones quedaron **0 altos, 2 medios, 1 bajo y 13 informativos**. Los dos medios corresponden a EA-02 y EA-04; el único bajo es la observación de HSTS refutada en EA-06.

OpenSSF Scorecard obtuvo **5,6/10**. Sus controles positivos fueron: cero vulnerabilidades conocidas, cero workflows peligrosos, dependencias fijadas, permisos mínimos en Actions, política de seguridad, ausencia de binarios versionados y actualización automática de dependencias. Reducen la nota la juventud del repositorio, su historial con un único mantenedor, la falta de protección de rama, revisión obligatoria, fuzzing, insignia OpenSSF y la ausencia deliberada de licencia abierta. Esas métricas de proceso no equivalen a vulnerabilidades explotables.

## Cambios aplicados durante la auditoría

- CodeQL configurado con consultas extendidas y amenaza remota;
- workflows programados y fijados por commit para OpenSSF Scorecard y OWASP ZAP;
- Dependabot semanal para npm y GitHub Actions;
- corrección de todos los avisos de CodeQL en pruebas;
- eliminación de `X-Powered-By`, incorporación de COEP y endurecimiento de `/api`;
- verificación de `npm test`, `npm run lint`, `npm audit`, E2E cifrado y despliegue.

## Riesgo residual y siguiente paso

La mejora de gobierno prioritaria es proteger `main`, exigir los controles de producción y al menos una revisión independiente. Cambiaría el flujo de publicación del propietario, por lo que no se ha impuesto silenciosamente. En el navegador, el trabajo principal es eliminar `style-src 'unsafe-inline'` después de sustituir los estilos dinámicos por componentes compatibles con CSP.

El cifrado de extremo a extremo no protege un enlace completo filtrado, dispositivo/navegador/extensión comprometidos, un despliegue futuro malicioso, una captura o texto copiado. Compartir el enlace completo de invitación sigue equivaliendo a compartir una contraseña.

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
