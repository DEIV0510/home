// Mensajes de WhatsApp. Este archivo lo usan las páginas (HTML ya armado) y el navegador
// (cuando el visitante elige medida, tipo de colchón o línea): el texto es el mismo en ambos.
// Sin imports de datos: recibe todo por parámetro.

export const MARCA = 'HOME PREMIUM';

/** Enlace oficial wa.me con el número en formato internacional y el mensaje codificado. */
export const wa = (internacional: string, mensaje: string) => `https://wa.me/${internacional}?text=${encodeURIComponent(mensaje)}`;

export interface DatosMensaje {
  articulo: 'la' | 'el';
  nombre: string;
  /** Precio ya formateado ($1.299.999). */
  precio: string;
  /** Ancho elegido en cm (bases cama). */
  medida?: number | null;
  /** Con medidas sin elegir: el precio es «desde». */
  desde?: boolean;
}

const pieza = (d: DatosMensaje) => {
  const nombre = d.medida ? `${d.nombre} de ${d.medida} cm` : d.nombre;
  return d.desde ? `${d.articulo} ${nombre} (desde ${d.precio})` : `${d.articulo} ${nombre} de ${d.precio}`;
};

/** «QUIERO ESTE» — el texto del brief. */
export const mensajeQuiero = (d: DatosMensaje) =>
  `Hola, estoy interesado en ${pieza(d)} de ${MARCA}. ¿Me pueden brindar más información y disponibilidad?`;

/** Consulta (eligiendo línea). Si el producto aún no tiene foto en la web, las pide. */
export const mensajeConsulta = (d: DatosMensaje, conFoto: boolean) =>
  conFoto
    ? `Hola, quisiera consultar por ${pieza(d)} de ${MARCA}.`
    : `Hola, ¿me pueden enviar fotos de ${pieza(d)} de ${MARCA}?`;

/** Colchón en promoción — el texto del brief. */
export const mensajeColchon = (tipo: string, medida: string, precio: string) =>
  `Hola, quisiera información sobre el colchón ${tipo} de ${medida} de ${MARCA} por ${precio}`;

export const MENSAJES = {
  general: `Hola, quisiera información sobre los muebles de ${MARCA}.`,
  cotizar: `Hola, quisiera cotizar un mueble de ${MARCA}. ¿Me pueden ayudar?`,
  comedores: `Hola, quisiera conocer los comedores disponibles de ${MARCA}.`,
  tocadores: `Hola, quisiera conocer los tocadores disponibles de ${MARCA}.`,
  busqueda: (q: string) => `Hola, busco «${q}» en ${MARCA}. ¿Lo tienen disponible?`,
};
