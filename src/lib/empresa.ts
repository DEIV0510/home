// Datos de contacto de HOME PREMIUM: una sola fuente para todo el sitio.
// Solo lo que entregó el cliente. Sin dirección física, horario ni cobertura (no se inventan).

export const MARCA = 'HOME PREMIUM';

export interface Linea {
  id: 'linea-1' | 'linea-2';
  nombre: string;
  /** Número tal como se escribe en Colombia (10 dígitos). */
  numero: string;
  /** Formato internacional sin espacios ni símbolos, para wa.me y tel:. */
  internacional: string;
  /** Para mostrar: 322 408 3402. */
  visible: string;
}

const linea = (id: Linea['id'], nombre: string, numero: string): Linea => ({
  id,
  nombre,
  numero,
  internacional: `57${numero}`,
  visible: `${numero.slice(0, 3)} ${numero.slice(3, 6)} ${numero.slice(6)}`,
});

export const LINEAS: Linea[] = [linea('linea-1', 'Línea 1', '3224083402'), linea('linea-2', 'Línea 2', '3223049079')];

/** Línea a la que van directo los botones «QUIERO ESTE». La otra se elige en «Consultar». */
export const LINEA_PRINCIPAL = LINEAS[0];

export const INSTAGRAM = {
  usuario: 'home_premium01',
  url: 'https://www.instagram.com/home_premium01/',
};

export const DESCRIPCION_CORTA =
  'Fábrica de muebles para el hogar: salas, sofás cama, colchones, comedores y tocadores. Atención personalizada por WhatsApp.';
