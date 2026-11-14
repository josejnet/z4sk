# Z4SK brand and domain

## Core identity

- Name: `Z4SK`
- Primary domain: `z4sk.xyz`
- Brand line: `Ask. Answer. Dare.`
- Spanish adaptation: `Pregunta. Responde. Atrévete.`
- Primary orange: `#ff5a1f`
- Background: `#0b0b0b`
- Display type: editorial serif for emotional headlines
- Interface type: Geist Sans, with Geist Mono for technical labels

Use `Z4SK` in uppercase. Do not spell it as `Zask`, `Z4sk` or `Z 4 SK`. The spark/orbit symbol, warm orange, off-white type and black background form the recognizable visual system.

## Domain activation

The application uses `SITE_URL` as the single canonical origin for metadata, Open Graph links, the sitemap, robots file and server-generated shared links. Production uses:

```text
SITE_URL=https://z4sk.xyz
```

After purchasing the domain:

1. Add `z4sk.xyz` and `www.z4sk.xyz` to the Vercel project.
2. Apply the DNS records shown by Vercel at the registrar.
3. Make `z4sk.xyz` the primary domain and redirect `www.z4sk.xyz` to it.
4. Set the Production environment variable to `SITE_URL=https://z4sk.xyz`.
5. Redeploy production and verify the canonical link, social preview, sitemap and HTTPS redirect.

Do not change `SITE_URL` before Vercel reports the custom domain as valid; doing so would advertise links that do not resolve yet.
