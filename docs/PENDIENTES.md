# Pendientes

## Del cliente

- [ ] **Fotos de 16 salas** (lista en [FOTOS.md](FOTOS.md)) y la **foto promocional del colchón**.
- [ ] **Forma de las salas sin foto** (en L / compacta): hoy los filtros «Salas en L» y «Salas
      compactas» solo incluyen las que se ven en foto o lo dicen en el nombre (`etiquetas` en
      `src/data/catalogo.ts`). Solo «Sala cubo pequeña» es compacta por su nombre.
- [ ] **Comedores y tocadores**: modelos, fotos y precios.
- [ ] **Promoción «¡Gira y gana!»** (diapositiva 3 del catálogo de salas: descuentos de hasta
      $100.000). No se publicó: la pieza aún dice «AQUÍ VA EL LOGO» y no hay condiciones.
- [ ] **Datos legales** para la política de privacidad: razón social, NIT, correo de contacto.
- [ ] Revisar con un asesor los textos de `/privacidad/` y `/terminos/` (son una base).

## Antes de publicar

- [ ] Conectar el repositorio a Vercel (o el hosting elegido). Con Vercel, cada push a `main`
      publica.
- [ ] Dominio definitivo y variable `SITE_URL` (canonical, Open Graph absoluto, sitemap).
- [ ] Con el dominio estable en HTTPS, considerar `includeSubDomains; preload` en HSTS
      (`scripts/encabezados.mjs`), solo si todos los subdominios tienen HTTPS.
- [ ] Probar en producción: `npm run qa -- https://dominio/` y revisar los encabezados.

## Decisiones

- **Fuera del sitio por decisión del cliente (2026-11-09):** las 13 bases cama del PowerPoint
  «CATALOGO BASE CAMAS» y los combos «Sala L baúl y sofá cama» y «Sala L baúl especial y sofá
  cama» (diapositivas 4 y 5 del catálogo de salas). El material sigue en `_material-cliente/`.
- «Quiero este» va directo a la Línea 1; «Consultar» y el botón flotante dejan elegir línea
  (`LINEA_PRINCIPAL` en `src/lib/empresa.ts`).
- Portada: Sala L (foto 1) y Sala cubo grande (foto 2), elegidas en `src/lib/seleccion.ts`.
