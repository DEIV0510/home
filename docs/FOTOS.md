# Fotos

Todas las fotos son originales del cliente. No se usan imágenes generadas, de stock ni de otras marcas.

## Cómo agregar o cambiar una foto

1. Guardar el archivo en la carpeta de su categoría con el **id del producto** (está en
   `src/data/catalogo.ts`) y un número de orden. La `-1` es la portada de la tarjeta:

   ```
   assets/salas/sala-charleston-1.jpg
   assets/salas/sala-charleston-2.jpg
   assets/colchones/colchon-1.jpg        ← foto promocional del colchón
   assets/logo/emblema-home-premium.png  ← logo (no cambiar)
   ```

2. Correr `npm run fotos`: crea AVIF y WebP en varios anchos (`public/img/`) y actualiza
   `src/data/fotos.json`. Si el nombre no coincide con ningún producto, se detiene y lo dice.
3. `npm run check` y subir.

Las fotos no se recortan, retocan ni cambian de color: solo se reducen y se convierten de formato.
La tarjeta encuadra la foto con CSS; el visor (al tocarla) la muestra completa.

Los productos sin foto van en la **carta de precios** de su colección (nombre ····· precio, con
«Quiero este» y un botón para pedir fotos por WhatsApp). Al llegar la foto, basta con agregarla: el
producto pasa solo de la carta al carrusel de fotos.

## Origen

`scripts/extraer-pptx.py` sacó las fotos de los dos catálogos en PowerPoint que entregó el cliente
(`_material-cliente/`, no se suben al repositorio). La relación diapositiva → producto, con la huella
de cada archivo, está en [assets/ORIGEN.md](../assets/ORIGEN.md).

## Productos sin foto (16)

Sala Charleston, Sala Dubai, Sala Barcelona, Sala Ibiza 2.0, Sala Paredes, Sala Roma, Sala Madrid,
Sala Suiza 2.0, Sala Tokio, Sala Texas, Sala Miami, Sala Nube, Sala Múnich, Sala Milán, Sala Milán 2.0
y Sala Oslo. Tampoco llegó la foto promocional del colchón.

Comedores y tocadores no tienen productos todavía: su sección invita a pedir los modelos por
WhatsApp. Para publicarlos, agregarlos en `src/data/catalogo.ts` (categoría `comedores` o
`tocadores`) y sus fotos en `assets/comedores/` o `assets/tocadores/`.
