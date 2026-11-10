/** $1.299.999 — formato colombiano, sin decimales. */
export const precio = (valor: number) => `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(valor).replace(/\s/g, '')}`;

/** Quita tildes y pasa a minúsculas: «Múnich» y «munich» se encuentran igual. */
export const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** «Sala Charleston» → «Charleston» (para la placa de los productos sin foto). */
export const nombreCorto = (nombre: string) => nombre.replace(/^(Sala|Sofá cama)\s+/i, '');
