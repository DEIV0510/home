// Verificación del build (dist/): falla si algo está roto. Uso: npm run check
// - Enlaces internos, anclas y recursos (href, src, srcset) que no existen en dist/
// - Enlaces vacíos o «#»; externos con target=_blank sin rel=noopener
// - WhatsApp: solo los dos números del cliente, mensaje presente y codificado
// - Imágenes sin alt, sin width/height, o srcset que declara un ancho distinto al real
// - Un solo <h1> por página; datos estructurados válidos; CSP presente
// - Catálogo: los 26 modelos de salas del brief con su precio exacto, sofás cama, colchón;
//   ninguna foto de prueba publicada
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { PRODUCTOS } from '../src/data/catalogo.ts';

const DIST = 'dist';
const NUMEROS = ['573224083402', '573223049079'];
const INSTAGRAM = 'https://www.instagram.com/home_premium01/';
const errores = [];
const err = (archivo, msg) => errores.push(`${archivo}: ${msg}`);

const paginas = [];
(function recorrer(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) recorrer(p);
    else if (f.endsWith('.html')) paginas.push(p);
  }
})(DIST);

const existe = (url) => {
  const limpio = decodeURIComponent(url.split('#')[0].split('?')[0]);
  if (!limpio) return true;
  const p = path.join(DIST, limpio);
  if (fs.existsSync(p) && fs.statSync(p).isFile()) return true;
  return fs.existsSync(path.join(p, 'index.html'));
};
const anchos = new Map();
const anchoReal = async (url) => {
  if (!anchos.has(url)) anchos.set(url, (await sharp(path.join(DIST, url)).metadata()).width);
  return anchos.get(url);
};
const idsDe = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const idsPortada = idsDe(fs.readFileSync(path.join(DIST, 'index.html'), 'utf8'));

let totalWa = 0;
for (const archivo of paginas) {
  const html = fs.readFileSync(archivo, 'utf8');
  const rel = path.relative(DIST, archivo);
  const ids = idsDe(html);

  if ((html.match(/<h1[\s>]/g) || []).length !== 1) err(rel, 'debe tener exactamente un <h1>');
  if (!html.includes('http-equiv="Content-Security-Policy"')) err(rel, 'sin CSP');

  for (const [etiqueta, href] of html.matchAll(/<a\b[^>]*?\shref="([^"]*)"[^>]*>/g)) {
    const h = href.replace(/&amp;/g, '&');
    if (!h || h === '#') {
      // El visor llena su botón al abrirse (app.ts).
      if (!/data-visor-cta/.test(etiqueta)) err(rel, `enlace sin destino: «${href}»`);
    } else if (h.startsWith('https://wa.me/')) {
      totalWa++;
      const u = new URL(h);
      if (!NUMEROS.includes(u.pathname.slice(1))) err(rel, `WhatsApp con otro número: ${u.pathname}`);
      if (!u.searchParams.get('text')) err(rel, 'WhatsApp sin mensaje');
      if (/[\s¿?¡áéíóúñ×«»$]/i.test(h.split('?text=')[1] ?? '')) err(rel, `mensaje de WhatsApp sin codificar: ${h.slice(0, 70)}`);
    } else if (h.startsWith('/')) {
      const [ruta, ancla] = h.split('#');
      if (!existe(ruta || '/')) err(rel, `enlace interno roto: ${h}`);
      if (ancla && (ruta === '/' || ruta === '') && !idsPortada.has(ancla)) err(rel, `ancla inexistente en la portada: ${h}`);
    } else if (h.startsWith('#')) {
      if (!ids.has(h.slice(1))) err(rel, `ancla inexistente: ${h}`);
    } else if (!/^(https:\/\/|tel:\+57\d{10}$)/.test(h)) err(rel, `enlace raro: ${h}`);
    if (/target="_blank"/.test(etiqueta) && !/rel="[^"]*noopener/.test(etiqueta)) err(rel, `target=_blank sin rel=noopener: ${h.slice(0, 60)}`);
  }
  for (const [, src] of html.matchAll(/\s(?:src|href)="(\/[^"]+\.(?:webp|avif|png|jpg|svg|woff2|webmanifest|ico))"/g)) {
    if (!existe(src)) err(rel, `recurso inexistente: ${src}`);
  }
  for (const [, set] of html.matchAll(/\s(?:srcset|imagesrcset)="([^"]+)"/g)) {
    for (const parte of set.split(',')) {
      const [url, w] = parte.trim().split(/\s+/);
      if (!existe(url)) {
        err(rel, `srcset con archivo inexistente: ${url}`);
        continue;
      }
      const real = await anchoReal(url);
      if (w && Number(w.replace('w', '')) !== real) err(rel, `srcset miente: ${url} dice ${w}, mide ${real}`);
    }
  }
  for (const [img] of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt(="|[\s>])/.test(img)) err(rel, `imagen sin alt: ${img.slice(0, 80)}`);
    if (!/\swidth="\d+"/.test(img) || !/\sheight="\d+"/.test(img)) err(rel, `imagen sin width/height: ${img.slice(0, 80)}`);
  }
  for (const [, json] of html.matchAll(/<script type="application\/(?:ld\+)?json"[^>]*>(.*?)<\/script>/gs)) {
    try {
      JSON.parse(json);
    } catch {
      err(rel, 'JSON embebido inválido');
    }
    if (json.includes('<')) err(rel, 'JSON embebido con «<» sin escapar');
  }
  if (!html.includes(`href="${INSTAGRAM}"`)) err(rel, 'falta el enlace a Instagram');
  for (const n of NUMEROS) if (!html.includes(`tel:+${n}`)) err(rel, `falta el teléfono ${n}`);
}

// Catálogo publicado = catálogo de datos; precios del brief exactos.
const index = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const BRIEF = {
  'Sala Charleston': 999999, 'Sala cubo pequeña': 1049000, 'Sala riñonera': 1099999, 'Sala riñonera rajada': 1099999, 'Sala Dubai': 1099999,
  'Sala cubo grande': 1199000, 'Sala L': 1299999, 'Sala Barcelona': 1299999, 'Sala Ibiza 2.0': 1299999, 'Sala Paredes': 1299999,
  'Sala Roma': 1299999, 'Sala Madrid': 1299999, 'Sala Suiza 2.0': 1299999, 'Sala Audi': 1349999, 'Sala brazo en H': 1399999,
  'Sala Tokio': 1499999, 'Sala Texas': 1599999, 'Sala Miami': 1599999, 'Sala Nube': 1699999, 'Sala L Baúl': 1709999,
  'Sala Múnich': 1699999, 'Sala huevo': 2129999, 'Sala Milán': 2199999, 'Sala huevo con carro': 2299999, 'Sala Milán 2.0': 2399999,
  'Sala Oslo': 1149999, 'Sofá cama de 1.50 m de ancho': 1249999, 'Sofá cama de 1.80 m de ancho': 1299999,
};
for (const [nombre, valor] of Object.entries(BRIEF)) {
  const p = PRODUCTOS.find((x) => x.nombre === nombre);
  if (!p) err('catalogo.ts', `falta «${nombre}»`);
  else if (p.precio !== valor) err('catalogo.ts', `precio de «${nombre}»: ${p.precio} ≠ ${valor}`);
  if (!index.includes(`data-nombre="${nombre}"`)) err('index.html', `no se publicó «${nombre}»`);
}
if (PRODUCTOS.filter((p) => p.categoria === 'salas').length < 26) err('catalogo.ts', 'menos de 26 salas');
if (new Set(PRODUCTOS.map((p) => p.id)).size !== PRODUCTOS.length) err('catalogo.ts', 'ids repetidos');
for (const p of PRODUCTOS) if (!index.includes(`id="p-${p.id}"`)) err('index.html', `sin tarjeta: ${p.nombre}`);
if (!index.includes('id="p-colchon"') || !index.includes('$799.999')) err('index.html', 'falta la promoción del colchón');
const { origen } = JSON.parse(fs.readFileSync('src/data/fotos.json', 'utf8'));
if (origen !== 'assets') err('fotos.json', `las fotos salen de «${origen}» (¿quedaron fotos de prueba?): corre npm run fotos`);

console.log(`${paginas.length} páginas · ${totalWa} enlaces de WhatsApp · ${anchos.size} imágenes medidas · ${PRODUCTOS.length + 1} productos`);
if (errores.length) {
  console.error(errores.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log('✓ Sin errores');
