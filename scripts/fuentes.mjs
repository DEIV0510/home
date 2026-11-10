// Fuentes autoalojadas:
//   · Cormorant Garamond: titulares. Sus mayúsculas romanas hacen eco a las letras del emblema.
//     Se fija en UNA instancia estática por estilo (redonda 600, cursiva 500): pesa menos y no
//     obliga al navegador a crear instancias de la fuente variable en el primer diseño.
//   · Jost: navegación, textos, precios y botones (variable solo entre 400 y 600).
// - Recorta cada fuente a los glifos del español que usa el sitio.
// - Nombre con hash (caché inmutable) en public/fonts/.
// - Genera src/styles/fuentes.css con @font-face + respaldos con métricas ajustadas (capsize),
//   para que el texto no salte al llegar la fuente (CLS).
// - Genera src/data/fuentes.json con las rutas para el <link rel="preload">.
// Uso: npm run fonts
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import subsetFont from 'subset-font';
import { createFontStack } from '@capsizecss/core';
import cormorant from '@capsizecss/metrics/cormorantGaramond';
import jost from '@capsizecss/metrics/jost';
import arial from '@capsizecss/metrics/arial';
import times from '@capsizecss/metrics/timesNewRoman';

export const PESO_TITULAR = 600;
export const PESO_CURSIVA = 500;

const OUT_DIR = 'public/fonts';
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

let chars = '';
for (let c = 0x20; c <= 0x7e; c++) chars += String.fromCharCode(c); // ASCII imprimible
for (let c = 0xa0; c <= 0xff; c++) chars += String.fromCharCode(c); // á é í ó ú ñ ü ¿ ¡ « » · ×
chars += [0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026, 0x2022, 0x2192, 0x2190, 0x2197, 0x2212, 0x2009, 0x202f]
  .map((c) => String.fromCharCode(c))
  .join('');

const hash = (buf) => crypto.createHash('md5').update(buf).digest('hex').slice(0, 8);
const BASE = 'node_modules/@fontsource-variable';

async function build(src, nombre, opts = {}) {
  const input = fs.readFileSync(src);
  const out = await subsetFont(input, chars, { targetFormat: 'woff2', ...opts });
  const archivo = `${nombre}.${hash(out)}.woff2`;
  fs.writeFileSync(path.join(OUT_DIR, archivo), out);
  console.log(`${archivo}: ${(input.length / 1024).toFixed(1)} KB → ${(out.length / 1024).toFixed(1)} KB`);
  return `/fonts/${archivo}`;
}

const titular = await build(`${BASE}/cormorant-garamond/files/cormorant-garamond-latin-wght-normal.woff2`, 'cormorant', {
  variationAxes: { wght: PESO_TITULAR },
});
const cursiva = await build(`${BASE}/cormorant-garamond/files/cormorant-garamond-latin-wght-italic.woff2`, 'cormorant-cursiva', {
  variationAxes: { wght: PESO_CURSIVA },
});
const texto = await build(`${BASE}/jost/files/jost-latin-wght-normal.woff2`, 'jost', {
  variationAxes: { wght: { min: 400, max: 600 } },
});

const display = createFontStack([cormorant, times], { fontFaceFormat: 'styleString' });
const text = createFontStack([jost, arial], { fontFaceFormat: 'styleString' });

const css = `/* Generado por scripts/fuentes.mjs — no editar a mano. */
@font-face {
  font-family: 'Cormorant Garamond';
  src: url('${titular}') format('woff2');
  font-weight: ${PESO_TITULAR};
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Cormorant Garamond';
  src: url('${cursiva}') format('woff2');
  font-weight: ${PESO_CURSIVA};
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: 'Jost';
  src: url('${texto}') format('woff2');
  font-weight: 400 600;
  font-style: normal;
  font-display: swap;
}
${display.fontFaces}
${text.fontFaces}
:root {
  --font-titular: ${display.fontFamily}, Georgia, serif;
  --font-texto: ${text.fontFamily}, system-ui, sans-serif;
}
`;

fs.mkdirSync('src/styles', { recursive: true });
fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/styles/fuentes.css', css);
fs.writeFileSync('src/data/fuentes.json', JSON.stringify({ titular, cursiva, texto }, null, 2) + '\n');
console.log('→ src/styles/fuentes.css, src/data/fuentes.json');
