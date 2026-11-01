# Despliegue

[English version](DEPLOYMENT.md)

## Arquitectura de producción

- proyecto de Vercel: `josejcoy-9481s-projects/z4sk`
- repositorio de GitHub: `josejnet/z4sk`
- base de datos: Neon Postgres gestionado desde Vercel
- rol de ejecución: acceso DML limitado a las tablas de la aplicación
- rol de migración: credencial propietaria del esquema, disponible solo en GitHub Actions
- retención: `0 3 * * *` (cada día a las 03:00 UTC)

Producción en Vercel necesita `DATABASE_URL`, `FOUNDER_DASHBOARD_KEY`, `CRON_SECRET`, `RATE_LIMIT_HMAC_SECRET`, `OPERATOR_NAME`, `PRIVACY_EMAIL` y el valor comprobado de `NEON_RESTORE_WINDOW_HOURS`. Preview y Development usan la base aislada `z4sk_staging_e2e` y su propio secreto HMAC.

GitHub Actions necesita estos secretos del repositorio:

- `Z4SK_STAGING_DATABASE_URL`: conexión restringida a `z4sk_staging_e2e`
- `Z4SK_STAGING_HMAC_SECRET`: secreto HMAC no productivo
- `Z4SK_PRODUCTION_MIGRATION_DATABASE_URL`: conexión propietaria del esquema de producción
- `VERCEL_DEPLOY_HOOK_URL`: Deploy Hook limitado a `main`

Los secretos nunca deben entrar en Git, registros, resultados de compilación ni variables expuestas al navegador.

## Preparación local

Usa Node.js 24:

```bash
npm ci
vercel link --yes --project z4sk
vercel env pull .env.local --yes --environment=development
npm run db:migrate
npm run lint
npm test
```

La URL descargada para desarrollo debe apuntar a `z4sk_staging_e2e`, nunca a producción.

## Flujo de publicación

Los despliegues Git automáticos de Vercel están desactivados. Cada push a `main` ejecuta `.github/workflows/ci.yml`:

1. instalación reproducible con versiones fijadas de Node y las Actions;
2. lint, compilación, pruebas del HTML renderizado y auditoría completa de dependencias;
3. verificación cifrada de extremo a extremo sobre la base aislada de staging;
4. migraciones versionadas de producción con la credencial propietaria del esquema;
5. llamada al Deploy Hook de `main` solo si todo lo anterior termina correctamente.

El entorno `Production` de GitHub exige aprobación explícita antes de iniciar migraciones y despliegue. Solo la rama protegida `main` puede usarlo.

Para repetir manualmente el mismo flujo:

```bash
gh workflow run ci.yml --ref main
```

No ejecutes migraciones productivas con el `DATABASE_URL` de Vercel: ese rol no puede modificar el esquema de forma deliberada.

## Comprobaciones posteriores

- confirma que el despliegue está `READY` y asignado a `https://z4sk.vercel.app`;
- comprueba que la CSP contiene un nonce por petición y no permite scripts `unsafe-inline`;
- confirma que existen `Reporting-Endpoints`, los informes de la CSP aplicada y Trusted Types en modo informe;
- compara `deployment.commitSha` de `/api/privacy-proof` con el commit público y los metadatos de Vercel;
- crea, responde, descifra y elimina una invitación desechable;
- revisa `/api/privacy-proof` y el pulso diario de retención;
- inspecciona errores de producción sin imprimir cuerpos ni secretos.

## Reversión

```bash
vercel ls z4sk
vercel rollback
```

Revertir la aplicación no deshace migraciones. Toda migración debe ser compatible con la versión de aplicación anterior.

## Rotación de secretos

Rota los secretos de ejecución de Vercel con `vercel env add ... --sensitive` y publica mediante el pipeline verificado. La credencial de migración y el Deploy Hook se rotan en GitHub, no en las variables de ejecución de Vercel.

Cambiar `RATE_LIMIT_HMAC_SECRET` solo invalida los seudónimos de límites y denunciantes; no afecta a enlaces del creador ni a respuestas cifradas. Comprueba que la clave anterior del panel devuelve `403` y la nueva devuelve `200` en `/api/founder/metrics`.

## Protección del repositorio

El repositorio público protege `main` con el control `verify`, rama actualizada, una aprobación por pull request, revisión del propietario del código, descarte de aprobaciones antiguas, resolución de conversaciones, historial lineal y bloqueo de borrado/force-push. El propietario conserva el bypass administrativo de GitHub para recuperación de emergencia; es una frontera de confianza de un proyecto con un solo mantenedor, no una revisión independiente. La firma obligatoria queda pendiente hasta registrar y respaldar de forma segura una clave de firma.
