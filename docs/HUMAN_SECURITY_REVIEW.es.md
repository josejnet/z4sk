# Paquete para revisión humana de seguridad

[English](HUMAN_SECURITY_REVIEW.md) · [Política de seguridad](../SECURITY.md) · [Protocolo criptográfico](CRYPTOGRAPHY.md) · [Auditoría automatizada](EXTERNAL_AUDIT.es.md)

Este documento fija un alcance reproducible para una revisión criptográfica y un pentest web independientes. **No** afirma que esa revisión humana ya se haya realizado.

## Independencia solicitada

La persona revisora no debe haber desarrollado Z4SK y debe declarar conflictos personales o comerciales. Cada hallazgo debe incluir evidencia, pasos reproducibles, gravedad, commit afectado y resultado de la comprobación posterior. El informe nunca debe contener enlaces reales, credenciales de producción ni datos de usuarios.

## Alcance

- código público en `https://github.com/josejnet/z4sk`;
- commit exacto mostrado en `https://z4sk.vercel.app/audit` y `/api/privacy-proof`;
- invitaciones desechables creadas exclusivamente para la revisión;
- criptografía del navegador en `app/lib/invitation-crypto.ts` y `app/lib/response-crypto.ts`;
- autorización, caducidad, consumo único, borrado, abuso y retención de las API;
- GitHub Actions, migraciones, service worker, CSP y fronteras del despliegue.

## Preguntas obligatorias

1. ¿Puede el servidor, base de datos, logs o panel fundador recuperar texto claro usando solo el estado almacenado?
2. ¿Puede alguien sin autorización listar, adivinar, leer, modificar, repetir o borrar invitaciones o respuestas?
3. ¿Son seguros los nonces AES-GCM, claves ECDH, contexto HKDF, entropía y sobres autenticados?
4. ¿Permiten las condiciones de carrera eludir lectura única o respuesta única?
5. ¿Pueden fragmentos, cabeceras bearer, caché del service worker, historial, referrer, informes CSP o errores filtrar un enlace completo?
6. ¿Puede una dependencia, CI, cuenta mantenedora o despliegue comprometido sustituir el código cliente sin evidencia visible?

## Seguridad y comunicación

Usa los [avisos privados de GitHub](https://github.com/josejnet/z4sk/security/advisories/new). No ataques infraestructura de proveedores, datos ajenos, disponibilidad ni usuarios. Limita las pruebas activas y usa solo registros desechables propios. Tras corregir, el propietario debe publicar un informe redactado y la evidencia del retest.

## Evidencia actual y límite explícito

CodeQL, OWASP ZAP, OpenSSF Scorecard, auditoría de dependencias y E2E cifrado de staging están documentados en [EXTERNAL_AUDIT.es.md](EXTERNAL_AUDIT.es.md). Son evidencia útil, pero no sustituyen el trabajo humano independiente definido aquí.
