# Diseño

**Idea:** el sitio se ve como el emblema de la marca: azul noche, dorado champaña y letras
romanas. Las fotos reales de los muebles van al frente y cada pantalla termina en un botón de
WhatsApp.

## Identidad

- **Logo:** el emblema original (`assets/logo/`), sin redibujar ni recolorear. Solo se quitó el fondo
  negro de afuera del círculo y se generaron tamaños. Está en la cabecera, la pantalla de carga, el
  menú y el pie.
- **Colores:** carbón `#151515`, azul noche `#172536`, dorado `#B69A68` (acentos, precios destacados,
  botones), marfil `#F5F1E9`, gris cálido `#A8A29A`, blanco. Sobre fondo claro, el dorado de texto
  es `#7A6136` (contraste 5:1).
- **Tipografía:** Cormorant Garamond 600 en mayúsculas para los titulares (eco de las letras del
  emblema), su cursiva 500 para una palabra de acento; Jost 400–600 para menú, textos, precios y
  botones.
- **Esquinas rectas** en todo (botones, tarjetas, diálogos). Sin píldoras, emojis ni degradados de
  adorno; los únicos degradados son velos para que el texto se lea sobre las fotos.

## Movimiento

- Pantalla de carga: el emblema aparece con un barrido circular y un brillo, línea dorada de
  progreso y «Diseño · Confort · Calidad». Sale abriéndose en dos paneles. Solo en la primera
  visita de la sesión; con movimiento reducido aparece y desaparece sin animación.
- Portada: titular que sube línea por línea, foto que se descubre como un telón, marco dorado y
  segunda foto con parallax a distinta velocidad (CSS `scroll-timeline`, sin librerías).
- Catálogo corto a propósito: cada colección es un **carrusel** con los modelos que tienen foto
  (deslizable, barra de avance dorada y flechas) y una **carta de precios** con los demás (en
  celular, 6 a la vista y «Ver los N modelos»). Tarjetas sin caja: la foto manda.
- Catálogo: zoom sutil de la foto y relleno dorado del botón al pasar el
  cursor; los filtros reacomodan las tarjetas con View Transitions.
- Solo se animan `transform` y `opacity`. Con `prefers-reduced-motion` no hay parallax ni
  desplazamientos.

## Conversión

- «Quiero este» en cada producto, directo a WhatsApp con el mensaje del brief.
- «Consultar», el botón flotante y la cabecera dejan elegir línea (1 o 2).
- Productos sin foto: en la carta, la fila entera es «Quiero este» y la cámara pide las fotos.
- Colchón: tarjeta especial con garantía, envío gratis y selector ortopédico/semiortopédico.
