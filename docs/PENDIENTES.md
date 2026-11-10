# Pendientes

## Del cliente

- [ ] **Fotos de 16 salas** (lista en [FOTOS.md](FOTOS.md)) y la **foto promocional del colchón**.
- [ ] **Forma de las salas sin foto** (en L / compacta): hoy los filtros «Salas en L» y «Salas
      compactas» solo incluyen las que se ven en foto o lo dicen en el nombre (`etiquetas` en
      `src/data/catalogo.ts`). Solo «Sala cubo pequeña» es compacta por su nombre.
- [ ] **Confirmar precios dudosos de bases cama** (copiados tal cual del PowerPoint):
  - Base cama capitoneada con luces LED: el precio sale de una etiqueta de la diapositiva 3 y es
    idéntico al de «Base cama en “M” con espejo» ($840.000 / $850.000 / $870.000).
  - Base cama espejo en “M” con piecero y Base cama trenzada con piecero: 120 y 140 cm cuestan lo
    mismo ($1.050.000).
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

## Decisiones tomadas sin consultar (fáciles de revertir)

- Se agregaron las **bases cama** (13 modelos con precio por ancho) y dos combos de sala
  (**Sala L baúl y sofá cama** $2.099.999 y **Sala L baúl especial y sofá cama** $2.199.999), que
  estaban en los catálogos en PowerPoint aunque no en el brief escrito.
- «Quiero este» va directo a la Línea 1; «Consultar» y el botón flotante dejan elegir línea
  (`LINEA_PRINCIPAL` en `src/lib/empresa.ts`).
- Ancho de las bases cama mostrado en «cm» (el catálogo dice «MEDIDA: 100 120 140»).
