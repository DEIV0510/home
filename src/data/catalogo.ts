// Catálogo de HOME PREMIUM: la única fuente de productos, categorías y precios del sitio.
//
// Reglas:
// · Nombres y precios EXACTOS del brief del cliente y de sus catálogos en PowerPoint
//   (_material-cliente/, ver assets/ORIGEN.md). No se inventan productos ni precios.
// · Las fotos NO se declaran aquí: `npm run fotos` busca en assets/<categoría>/ los archivos
//   <id>-1.png, <id>-2.jpg… y escribe src/data/fotos.json. Producto sin foto = «foto pendiente».
// · `etiquetas` (en L / compacta) solo se puso cuando el nombre o las fotos lo muestran; los
//   modelos sin foto quedan sin clasificar hasta tenerla (docs/PENDIENTES.md).
// · Este archivo lo leen también los scripts de Node (tipos borrables, sin imports).

export type CategoriaId = 'salas' | 'sofas-cama' | 'colchones' | 'comedores' | 'tocadores';
export type Etiqueta = 'en-l' | 'compacta';

/** Precio por ancho (en cm). Opcional: la tarjeta muestra «Desde» y un selector de medida. */
export interface Medida {
  cm: number;
  precio: number;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: CategoriaId;
  /** Artículo para el mensaje de WhatsApp: «la Sala…», «el Sofá cama…». */
  articulo: 'la' | 'el';
  /** Precio en pesos colombianos. Con `medidas`, es el menor (se muestra «desde»). */
  precio: number;
  medidas?: Medida[];
  etiquetas?: Etiqueta[];
  /** De dónde salió el dato: el brief escrito o el catálogo en PowerPoint (diapositiva). */
  origen: string;
}

export interface Categoria {
  id: CategoriaId;
  nombre: string;
  /** Producto cuya primera foto ilustra la categoría (si tiene). */
  portada?: string;
}

export const CATEGORIAS: Categoria[] = [
  { id: 'salas', nombre: 'Salas', portada: 'sala-huevo' },
  { id: 'sofas-cama', nombre: 'Sofás cama', portada: 'sofa-cama-180' },
  { id: 'colchones', nombre: 'Colchones' },
  { id: 'comedores', nombre: 'Comedores' },
  { id: 'tocadores', nombre: 'Tocadores' },
];

const sala = (id: string, nombre: string, precio: number, origen: string, etiquetas?: Etiqueta[]): Producto => ({
  id,
  nombre,
  categoria: 'salas',
  articulo: 'la',
  precio,
  origen,
  ...(etiquetas ? { etiquetas } : {}),
});

const PPT_SALAS = 'Catálogo de salas (PowerPoint), diapositiva';

export const PRODUCTOS: Producto[] = [
  // ── Salas: los 26 modelos del brief, en su orden y con sus precios exactos ──
  sala('sala-charleston', 'Sala Charleston', 999999, 'brief'),
  sala('sala-cubo-pequena', 'Sala cubo pequeña', 1049000, `brief + ${PPT_SALAS} 6`, ['en-l', 'compacta']),
  sala('sala-rinonera', 'Sala riñonera', 1099999, `brief + ${PPT_SALAS} 7`, ['en-l']),
  sala('sala-rinonera-rajada', 'Sala riñonera rajada', 1099999, `brief + ${PPT_SALAS} 8`, ['en-l']),
  sala('sala-dubai', 'Sala Dubai', 1099999, 'brief'),
  sala('sala-cubo-grande', 'Sala cubo grande', 1199000, `brief + ${PPT_SALAS} 9`),
  sala('sala-l', 'Sala L', 1299999, `brief + ${PPT_SALAS} 12`, ['en-l']),
  sala('sala-barcelona', 'Sala Barcelona', 1299999, 'brief'),
  sala('sala-ibiza-2-0', 'Sala Ibiza 2.0', 1299999, 'brief'),
  sala('sala-paredes', 'Sala Paredes', 1299999, 'brief'),
  sala('sala-roma', 'Sala Roma', 1299999, 'brief'),
  sala('sala-madrid', 'Sala Madrid', 1299999, 'brief'),
  sala('sala-suiza-2-0', 'Sala Suiza 2.0', 1299999, 'brief'),
  sala('sala-audi', 'Sala Audi', 1349999, `brief + ${PPT_SALAS} 10`, ['en-l']),
  sala('sala-brazo-en-h', 'Sala brazo en H', 1399999, `brief + ${PPT_SALAS} 11`, ['en-l']),
  sala('sala-tokio', 'Sala Tokio', 1499999, 'brief'),
  sala('sala-texas', 'Sala Texas', 1599999, 'brief'),
  sala('sala-miami', 'Sala Miami', 1599999, 'brief'),
  sala('sala-nube', 'Sala Nube', 1699999, 'brief'),
  sala('sala-l-baul', 'Sala L Baúl', 1709999, `brief + ${PPT_SALAS} 13`, ['en-l']),
  sala('sala-munich', 'Sala Múnich', 1699999, 'brief'),
  sala('sala-huevo', 'Sala huevo', 2129999, `brief + ${PPT_SALAS} 14`),
  sala('sala-milan', 'Sala Milán', 2199999, 'brief'),
  sala('sala-huevo-con-carro', 'Sala huevo con carro', 2299999, `brief + ${PPT_SALAS} 15`),
  sala('sala-milan-2-0', 'Sala Milán 2.0', 2399999, 'brief'),
  sala('sala-oslo', 'Sala Oslo', 1149999, 'brief'),

  // ── Sofás cama ──
  { id: 'sofa-cama-150', nombre: 'Sofá cama de 1.50 m de ancho', categoria: 'sofas-cama', articulo: 'el', precio: 1249999, origen: `brief + ${PPT_SALAS} 16` },
  { id: 'sofa-cama-180', nombre: 'Sofá cama de 1.80 m de ancho', categoria: 'sofas-cama', articulo: 'el', precio: 1299999, origen: `brief + ${PPT_SALAS} 17` },
];
// Fuera del sitio por decisión del cliente (2026-11-09), aunque estén en los PowerPoint: las 13
// bases cama y los combos «Sala L baúl (especial) y sofá cama». No volver a agregarlos sin su OK.

/** Promoción del colchón: datos del brief, tal cual. */
export const COLCHON = {
  id: 'colchon',
  nombre: 'Colchones ortopédicos y semiortopédicos',
  medida: '1.40 × 1.90 m',
  precio: 799999,
  garantia: '5 años',
  envio: 'Envío totalmente gratis',
  tipos: ['ortopédico', 'semiortopédico'] as const,
  origen: 'brief (promoción)',
};
