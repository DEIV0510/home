# HOME PREMIUM

Sitio de venta de la fábrica de muebles HOME PREMIUM: catálogo con precios y pedidos por WhatsApp
(líneas 322 408 3402 y 322 304 9079). Web estática (Astro 7), sin base de datos, pagos ni cuentas.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala dependencias (Node 22.18 o superior). |
| `npm run dev` | Servidor de desarrollo en http://localhost:5640 |
| `npm run build` | Compila a `dist/` y escribe la CSP con hashes de cada página. |
| `npm run preview` | Sirve `dist/` en http://localhost:5641 con las cabeceras de producción. |
| `npm run check` | Tipos + build + verificación (enlaces, WhatsApp, precios del brief, imágenes). |
| `npm run fotos` | Convierte las fotos de `assets/` a AVIF/WebP y procesa el logo. |
| `npm run fonts` | Recorta las fuentes (Cormorant Garamond y Jost). |
| `npm run og` | Regenera la imagen para redes `public/og.jpg`. |
| `npm run headers` | Regenera `vercel.json` y `public/_headers` (cabeceras de seguridad). |
| `npm run qa` | Pruebas en Chrome real contra `npm run preview`: precios, cada WhatsApp, filtros, buscador, capas, botón atrás, sin JS. |
| `npm run qa:capturas` / `qa:metricas` | Capturas celular/escritorio en `.cache/qa/` · LCP y CLS con red y CPU lentas. |

## Dónde se cambia cada cosa

- **Productos, precios y categorías:** `src/data/catalogo.ts` (única fuente).
- **Fotos:** `assets/<categoría>/<id>-<n>.jpg` y luego `npm run fotos` → [docs/FOTOS.md](docs/FOTOS.md).
- **Teléfonos, Instagram, línea principal:** `src/lib/empresa.ts`.
- **Textos de los mensajes de WhatsApp:** `src/lib/mensajes.ts`.
- **Fotos de la portada:** `src/lib/seleccion.ts`.

## Documentos

- [docs/PENDIENTES.md](docs/PENDIENTES.md) — lo que falta del cliente y antes de publicar.
- [docs/FOTOS.md](docs/FOTOS.md) — cómo agregar fotos y qué productos no tienen.
- [docs/SEGURIDAD.md](docs/SEGURIDAD.md) — medidas aplicadas y lo que depende del hosting.
- [docs/DISENO.md](docs/DISENO.md) — decisiones de diseño.
- [assets/ORIGEN.md](assets/ORIGEN.md) — de qué diapositiva sale cada foto.

## Publicar (Vercel)

Importar el repositorio en Vercel: `vercel.json` ya trae el comando de build, la carpeta `dist` y las
cabeceras. Con el dominio definitivo, poner la variable `SITE_URL=https://dominio` para que salgan
canonical, Open Graph absolutos y el sitemap.
