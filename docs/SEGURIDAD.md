# Seguridad

Sitio estático: no hay servidor de aplicación, base de datos, formularios, cuentas ni pagos. La
superficie de ataque se reduce a lo que sirve el hosting y al JavaScript propio del navegador.

## Aplicado en el código

| Medida | Dónde |
|---|---|
| Content Security Policy por página con **hashes** de los scripts en línea, `script-src 'self'`, sin `eval`, `object-src 'none'`, `base-uri 'self'`, `form-action 'none'`, `frame-src 'none'` | `scripts/csp.mjs` (corre en `npm run build`) |
| **Trusted Types** (`require-trusted-types-for 'script'`): el navegador bloquea `innerHTML`/`eval`; el JS solo usa `textContent` y la API del DOM | `scripts/csp.mjs`, `src/scripts/app.ts` |
| Clickjacking: `frame-ancestors 'none'` + `X-Frame-Options: DENY` | `scripts/encabezados.mjs` |
| `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (cámara, micrófono, ubicación, pagos… apagados), `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy` | `scripts/encabezados.mjs` → `vercel.json` y `public/_headers` |
| HSTS `max-age=31536000` (sin `preload` hasta tener el dominio definitivo) | `scripts/encabezados.mjs` |
| XSS: el buscador nunca escribe HTML; el texto buscado se muestra con `textContent` y va a WhatsApp codificado con `encodeURIComponent` (máx. 60 caracteres) | `src/scripts/app.ts` |
| JSON embebido escapado (`<` → `<`) | `src/lib/json.ts` |
| Enlaces externos con `rel="noopener"` | verificado por `scripts/verificar.mjs` |
| Sin claves, tokens ni `.env` en el repositorio (`.gitignore` los excluye); el sitio no necesita ninguno | `.gitignore` |
| Dependencias: solo Astro en producción; `npm audit` sin vulnerabilidades al entregar | `package.json` |

## No aplica (no hay operaciones en el servidor)

CSRF, rate limiting, validación en servidor, CORS, anti-spam y manejo de sesiones: el sitio no tiene
endpoints, formularios ni usuarios. Las solicitudes van por WhatsApp. Si en el futuro se agrega un
formulario o un panel, habrá que sumar validación en servidor, límite de envíos, protección CSRF y
control de acceso.

## Depende del hosting, el DNS y el dominio

- **HTTPS y redirección de HTTP a HTTPS:** Vercel lo hace solo. En otro hosting hay que activarlo.
- **CDN y WAF:** Vercel incluye CDN y protección DDoS básica; un WAF con reglas propias requiere
  plan de pago o un proxy (p. ej. Cloudflare).
- **HSTS preload:** solo con el dominio definitivo y todos sus subdominios en HTTPS.
- **Backups:** el código y las fotos viven en GitHub (cada commit es una copia). Conservar además
  los catálogos originales en PowerPoint (`_material-cliente/`, fuera del repositorio).
- **Acceso al panel del hosting y a GitHub:** verificación en dos pasos y la menor cantidad de
  personas con permisos.

Ninguna medida da protección absoluta; estas reducen los riesgos habituales de un sitio estático.
