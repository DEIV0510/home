import manifiesto from '../data/fotos.json';

/** [url, ancho, alto] */
type Variante = [string, number, number];

export interface Foto {
  n: number;
  w: number;
  h: number;
  /** Color de fondo de la foto: se pinta mientras carga. */
  bg: string;
  avif: Variante[];
  webp: Variante[];
}

// El JSON lo escribe scripts/fotos.mjs con esta forma; TypeScript lo infiere como arrays
// sueltos, de ahí el paso por unknown.
const FOTOS = (manifiesto as unknown as { origen: string; fotos: Record<string, Foto[]> }).fotos;

export const fotosDe = (id: string): Foto[] => FOTOS[id] ?? [];
export const portadaDe = (id: string): Foto | undefined => FOTOS[id]?.[0];

export const srcset = (v: Variante[]) => v.map(([url, w]) => `${url} ${w}w`).join(', ');

/** La variante más chica que cubra `ancho` px (para el src de respaldo). */
export const src = (v: Variante[], ancho = 640) => (v.find(([, w]) => w >= ancho) ?? v.at(-1)!)[0];
