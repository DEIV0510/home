// Fotos originales (assets/) → AVIF + WebP en anchos reales, y logo → emblema e íconos.
//
// PRODUCTOS
//   assets/<categoría>/<id>-<n>.(png|jpg|jpeg|webp)   p. ej. assets/salas/sala-charleston-1.jpg
//   · <id> es el del producto en src/data/catalogo.ts; <n> el orden (1 = foto de portada).
//   · Nunca se amplía, recorta, retoca ni cambia el color: solo se reduce de tamaño y se
//     convierte de formato. El encuadre de cada tarjeta lo hace el CSS; el visor muestra la
//     foto completa.
//   · Escribe src/data/fotos.json con las medidas REALES de cada archivo (el srcset no miente)
//     y el color de fondo de la foto (se pinta mientras carga).
//   · Una foto cuyo <id> no existe en el catálogo detiene el proceso: así no se cuela una foto
//     en el producto equivocado por un nombre mal escrito.
//
// MARCA
//   assets/logo/*.png → el emblema circular original. Solo se quita el fondo negro de afuera
//   del círculo (máscara circular) y se reduce de tamaño: el emblema no se redibuja ni se toca.
//   Escribe public/marca/ (emblema WebP, íconos PNG, favicon.ico) y src/data/marca.json.
//
// Caché: el nombre lleva el hash del original + ajustes; si ya existe, no se vuelve a codificar.
// Uso: npm run fotos            (ASSETS_DIR=otra/carpeta para probar con otras fotos)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { PRODUCTOS, COLCHON } from '../src/data/catalogo.ts';

const ORIGEN = process.env.ASSETS_DIR || 'assets';
const OUT = 'public/img';
const OUT_MARCA = 'public/marca';
const MANIFEST = 'src/data/fotos.json';
const MANIFEST_MARCA = 'src/data/marca.json';
// 400: tarjetas en pantallas 1x · 640: tarjetas en celular 2–3x · 960/1280: héroe y visor.
const ANCHOS = [400, 640, 960, 1280];
const AJUSTES = 'avif-q55-e5|webp-q80-e5|v1';
const CATEGORIAS = ['salas', 'sofas-cama', 'colchones', 'bases-cama', 'comedores', 'tocadores'];

const md5 = (buf) => crypto.createHash('md5').update(buf).digest('hex');
const hex = (n) => Math.round(n).toString(16).padStart(2, '0');
const categoriaDe = new Map(PRODUCTOS.map((p) => [p.id, p.categoria]));
categoriaDe.set(COLCHON.id, 'colchones');

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(OUT_MARCA, { recursive: true });
const vivos = new Set();
let nuevos = 0;

async function guardar(dest, generar) {
  vivos.add(path.resolve(dest));
  if (fs.existsSync(dest)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, await generar());
  nuevos++;
}

async function colorFondo(buf) {
  const { data, info } = await sharp(buf).resize(120, null).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const ch = [[], [], []];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (x > 6 && x < W - 6 && y > 6 && y < H - 6) continue;
      const i = (y * W + x) * 3;
      for (let k = 0; k < 3; k++) ch[k].push(data[i + k]);
    }
  const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
  return `#${hex(med(ch[0]))}${hex(med(ch[1]))}${hex(med(ch[2]))}`;
}

// ── Productos ──────────────────────────────────────────────────────────────────────────────
const errores = [];
const tareas = [];
for (const cat of CATEGORIAS) {
  const dir = path.join(ORIGEN, cat);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).sort()) {
    if (!/\.(png|jpe?g|webp)$/i.test(file)) continue;
    const m = file.match(/^(.+)-(\d+)\.\w+$/);
    if (!m) {
      errores.push(`${cat}/${file}: el nombre debe ser <id>-<n>.<ext>`);
      continue;
    }
    const [, id, n] = m;
    if (!categoriaDe.has(id)) errores.push(`${cat}/${file}: no hay ningún producto con id «${id}» en src/data/catalogo.ts`);
    else if (categoriaDe.get(id) !== cat) errores.push(`${cat}/${file}: «${id}» es de la categoría ${categoriaDe.get(id)}`);
    else tareas.push({ cat, file, id, n: Number(n) });
  }
}
if (errores.length) {
  console.error(errores.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}

const fotos = {};
async function procesar({ cat, file, id, n }) {
  const buf = fs.readFileSync(path.join(ORIGEN, cat, file));
  const h = md5(Buffer.concat([buf, Buffer.from(AJUSTES)])).slice(0, 8);
  // Gira según EXIF y pasa a sRGB una sola vez. Las fotos con transparencia se apoyan en blanco.
  const base = sharp(buf).rotate().toColorspace('srgb').flatten({ background: '#ffffff' });
  const { info } = await base.clone().toBuffer({ resolveWithObject: true });
  const anchos = [...ANCHOS.filter((w) => w < info.width), Math.min(info.width, ANCHOS.at(-1))].filter((w, i, a) => a.indexOf(w) === i);
  const entrada = { n, w: info.width, h: info.height, bg: await colorFondo(buf), avif: [], webp: [] };
  for (const w of anchos) {
    const alto = Math.round((info.height * w) / info.width);
    for (const fmt of ['avif', 'webp']) {
      const nombre = `${id}-${n}-${w}.${h}.${fmt}`;
      await guardar(path.join(OUT, cat, nombre), async () => {
        let img = base.clone().resize({ width: w, withoutEnlargement: true });
        if (w < info.width) img = img.sharpen({ sigma: 0.5 });
        return fmt === 'avif' ? img.avif({ quality: 55, effort: 5 }).toBuffer() : img.webp({ quality: 80, effort: 5 }).toBuffer();
      });
      entrada[fmt].push([`/img/${cat}/${nombre}`, w, alto]);
    }
  }
  (fotos[id] ??= []).push(entrada);
}

const cola = [...tareas];
const hilos = Math.max(2, Math.min(4, os.cpus().length >> 1));
await Promise.all(
  Array.from({ length: hilos }, async () => {
    while (cola.length) await procesar(cola.shift());
  }),
);
for (const lista of Object.values(fotos)) lista.sort((a, b) => a.n - b.n);
const ordenado = Object.fromEntries(Object.keys(fotos).sort().map((k) => [k, fotos[k]]));
fs.writeFileSync(MANIFEST, JSON.stringify({ origen: ORIGEN, fotos: ordenado }) + '\n');

// ── Marca ──────────────────────────────────────────────────────────────────────────────────
const dirLogo = path.join(ORIGEN, 'logo');
const archivoLogo = fs.existsSync(dirLogo) ? fs.readdirSync(dirLogo).find((f) => /\.(png|webp|jpe?g)$/i.test(f)) : undefined;
let marca = null;
if (archivoLogo) {
  const buf = fs.readFileSync(path.join(dirLogo, archivoLogo));
  const h = md5(Buffer.concat([buf, Buffer.from('marca-v3')])).slice(0, 8);
  // Círculo del emblema: caja de los píxeles que no son fondo negro.
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, x1 = 0, y0 = info.height, y1 = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 3;
      if (Math.max(data[i], data[i + 1], data[i + 2]) > 40) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  // El emblema original no es un círculo perfecto (1162 × 1172 px): máscara elíptica con sus
  // dos radios reales, sobre un lienzo cuadrado (al reducirlo no se deforma).
  const cx = (x0 + x1 + 1) / 2;
  const cy = (y0 + y1 + 1) / 2;
  const rx = (x1 - x0 + 1) / 2;
  const ry = (y1 - y0 + 1) / 2;
  const r = Math.max(rx, ry);
  const lado = Math.ceil(r * 2) + 2;
  const izq = Math.round(cx - lado / 2);
  const arriba = Math.round(cy - lado / 2);
  const mascara = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}"><ellipse cx="${cx - izq}" cy="${cy - arriba}" rx="${rx - 0.75}" ry="${ry - 0.75}" fill="#fff"/></svg>`);
  const emblema = await sharp(buf)
    .extract({ left: Math.max(0, izq), top: Math.max(0, arriba), width: lado, height: lado })
    .ensureAlpha()
    .composite([{ input: mascara, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // 320: pantalla de carga en celular 2x (debe pesar < 30 KB: se pide antes que nada).
  const anchosEmblema = [96, 160, 240, 320, 480];
  const webp = [];
  for (const w of anchosEmblema) {
    const nombre = `emblema-${w}.${h}.webp`;
    await guardar(path.join(OUT_MARCA, nombre), () => sharp(emblema).resize(w, w).webp({ quality: w >= 320 ? 74 : 82, alphaQuality: 60, effort: 6 }).toBuffer());
    webp.push([`/marca/${nombre}`, w]);
  }
  // Íconos cuadrados: emblema al `escala` del lado; los de iOS y «maskable» de Android van sobre
  // azul noche porque esos sistemas no muestran transparencia.
  const NOCHE = '#172536';
  const iconos = {};
  const pngs = { i16: [16, 1, '#0000'], i32: [32, 1, '#0000'], i180: [180, 0.86, NOCHE], i192: [192, 0.92, '#0000'], i512: [512, 0.92, '#0000'], m512: [512, 0.72, NOCHE] };
  for (const [clave, [lado, escala, fondo]] of Object.entries(pngs)) {
    const nombre = `icono-${clave}.${h}.png`;
    await guardar(path.join(OUT_MARCA, nombre), async () => {
      const e = Math.round(lado * escala);
      const capa = await sharp(emblema).resize(e, e).png().toBuffer();
      return sharp({ create: { width: lado, height: lado, channels: 4, background: fondo } })
        .composite([{ input: capa, left: Math.round((lado - e) / 2), top: Math.round((lado - e) / 2) }])
        .png(lado >= 180 ? { palette: true, quality: 92, effort: 10, compressionLevel: 9 } : { compressionLevel: 9 })
        .toBuffer();
    });
    iconos[clave] = `/marca/${nombre}`;
  }
  // favicon.ico con dos PNG dentro (16 y 32): formato ICO con carga PNG.
  const ico = [16, 32].map((l) => fs.readFileSync(path.join(OUT_MARCA, path.basename(iconos[`i${l}`]))));
  const cabecera = Buffer.alloc(6 + 16 * ico.length);
  cabecera.writeUInt16LE(0, 0);
  cabecera.writeUInt16LE(1, 2);
  cabecera.writeUInt16LE(ico.length, 4);
  let desplazamiento = cabecera.length;
  ico.forEach((png, k) => {
    const l = k === 0 ? 16 : 32;
    const o = 6 + 16 * k;
    cabecera.writeUInt8(l, o);
    cabecera.writeUInt8(l, o + 1);
    cabecera.writeUInt8(0, o + 2);
    cabecera.writeUInt8(0, o + 3);
    cabecera.writeUInt16LE(1, o + 4);
    cabecera.writeUInt16LE(32, o + 6);
    cabecera.writeUInt32LE(png.length, o + 8);
    cabecera.writeUInt32LE(desplazamiento, o + 12);
    desplazamiento += png.length;
  });
  fs.writeFileSync('public/favicon.ico', Buffer.concat([cabecera, ...ico]));
  marca = { origen: `${ORIGEN}/logo/${archivoLogo}`, emblema: { webp }, iconos };
  console.log(`emblema: elipse ${rx}×${ry} centro (${cx}, ${cy}) en ${info.width}×${info.height}`);
}
fs.writeFileSync(MANIFEST_MARCA, JSON.stringify(marca, null, 2) + '\n');

// Borra lo que ya no corresponde a ninguna foto ni ícono.
let borrados = 0;
(function limpiar(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) limpiar(p);
    else if (!vivos.has(path.resolve(p))) {
      fs.rmSync(p);
      borrados++;
    }
  }
})(OUT);
for (const f of fs.readdirSync(OUT_MARCA)) if (!vivos.has(path.resolve(path.join(OUT_MARCA, f)))) fs.rmSync(path.join(OUT_MARCA, f));

const peso = [...vivos].reduce((s, f) => s + fs.statSync(f).size, 0);
const conFoto = Object.keys(fotos).length;
console.log(`${tareas.length} fotos de ${conFoto} productos · ${vivos.size} archivos (${nuevos} nuevos, ${borrados} borrados) · ${(peso / 1048576).toFixed(1)} MB`);
const sinFoto = PRODUCTOS.filter((p) => !fotos[p.id]).map((p) => p.nombre);
if (sinFoto.length) console.log(`Sin foto (${sinFoto.length}): ${sinFoto.join(', ')}`);
