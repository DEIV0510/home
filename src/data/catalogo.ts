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

export type CategoriaId = 'salas' | 'sofas-cama' | 'colchones' | 'bases-cama' | 'comedores' | 'tocadores';
export type Etiqueta = 'en-l' | 'compacta';

export interface Medida {
  /** Ancho en centímetros, tal como lo escribe el catálogo (100, 120, 140). */
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
  { id: 'salas', nombre: 'Salas', portada: 'sala-l' },
  { id: 'sofas-cama', nombre: 'Sofás cama', portada: 'sofa-cama-180' },
  { id: 'colchones', nombre: 'Colchones' },
  { id: 'bases-cama', nombre: 'Bases cama', portada: 'base-cama-nube-almeja' },
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
const PPT_CAMAS = 'Catálogo de bases cama (PowerPoint), diapositiva';

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
  // Dos combos que trae el catálogo en PowerPoint y no estaban en el brief escrito.
  sala('sala-l-baul-y-sofa-cama', 'Sala L baúl y sofá cama', 2099999, `${PPT_SALAS} 4`, ['en-l']),
  sala('sala-l-baul-especial-y-sofa-cama', 'Sala L baúl especial y sofá cama', 2199999, `${PPT_SALAS} 5`, ['en-l']),

  // ── Sofás cama ──
  { id: 'sofa-cama-150', nombre: 'Sofá cama de 1.50 m de ancho', categoria: 'sofas-cama', articulo: 'el', precio: 1249999, origen: `brief + ${PPT_SALAS} 16` },
  { id: 'sofa-cama-180', nombre: 'Sofá cama de 1.80 m de ancho', categoria: 'sofas-cama', articulo: 'el', precio: 1299999, origen: `brief + ${PPT_SALAS} 17` },

  // ── Bases cama (catálogo en PowerPoint): precio por ancho 100 / 120 / 140 cm ──
  ...(
    [
      ['base-cama-capitoneada-luces-led', 'Base cama capitoneada con luces LED', [840000, 850000, 870000], 3],
      ['base-cama-espejo-m-piecero', 'Base cama espejo en “M” con piecero', [980000, 1050000, 1050000], 4],
      ['base-cama-nube-rayada', 'Base cama nube rayada', [950000, 960000, 990000], 5],
      ['base-cama-nube-almeja', 'Base cama nube en almeja', [950000, 960000, 990000], 6],
      ['base-cama-m-espejo', 'Base cama en “M” con espejo', [840000, 850000, 870000], 7],
      ['base-cama-trenzada-led-espejo', 'Base cama trenzada con luces LED y espejo', [1000000, 1050000, 1070000], 8],
      ['base-cama-trenzada-piecero', 'Base cama trenzada con piecero', [980000, 1050000, 1050000], 9],
      ['base-cama-trenzada', 'Base cama trenzada', [770000, 800000, 830000], 10],
      ['base-cama-reina', 'Base cama Reina', [830000, 850000, 870000], 11],
      ['base-cama-triangulo', 'Base cama triángulo', [800000, 820000, 850000], 12],
      ['base-cama-capitoneada-cuadrada', 'Base cama capitoneada cuadrada', [680000, 700000, 750000], 13],
      ['base-cama-rajada-piecero', 'Base cama rajada con piecero', [810000, 830000, 860000], 14],
      ['base-cama-capitoneada-copete', 'Base cama capitoneada con copete', [680000, 700000, 720000], 15],
    ] as const
  ).map(
    ([id, nombre, precios, diapositiva]): Producto => ({
      id,
      nombre,
      categoria: 'bases-cama',
      articulo: 'la',
      precio: Math.min(...precios),
      medidas: [100, 120, 140].map((cm, i) => ({ cm, precio: precios[i] })),
      origen: `${PPT_CAMAS} ${diapositiva}`,
    }),
  ),
];

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
