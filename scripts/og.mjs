// Imagen para compartir en redes (public/og.jpg, 1200×630): emblema original, titular y la
// foto de portada. Se dibuja con el Chrome instalado (mismas fuentes que el sitio).
// Uso: npm run og   (después de npm run fonts y npm run fotos)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { HEROE } from '../src/lib/seleccion.ts';

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const fuentes = JSON.parse(fs.readFileSync('src/data/fuentes.json', 'utf8'));
const marca = JSON.parse(fs.readFileSync('src/data/marca.json', 'utf8'));
const { fotos } = JSON.parse(fs.readFileSync('src/data/fotos.json', 'utf8'));
const archivo = (url) => pathToFileURL(path.resolve('public' + url)).href;
const foto = (id) => archivo(fotos[id][0].webp.at(-1)[0]);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:C;src:url(${archivo(fuentes.titular)});font-weight:600}
@font-face{font-family:C;src:url(${archivo(fuentes.cursiva)});font-weight:500;font-style:italic}
@font-face{font-family:J;src:url(${archivo(fuentes.texto)});font-weight:400 600}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;background:#172536;color:#f5f1e9;font-family:J;display:grid;grid-template-columns:560px 1fr}
.izq{padding:56px 0 52px 64px;display:flex;flex-direction:column;justify-content:space-between}
.emblema{width:108px;height:108px}
h1{font:600 70px/0.96 C;text-transform:uppercase;letter-spacing:.005em}
h1 em{display:block;font:italic 500 74px/1 C;text-transform:none;color:#b69a68;margin-top:4px}
p{font-size:21px;letter-spacing:.02em;color:rgba(245,241,233,.85)}
.der{position:relative;padding:56px 56px 56px 8px}
.marco{position:absolute;inset:84px 28px 28px 36px;border:1px solid rgba(182,154,104,.6)}
.foto{position:relative;width:100%;height:100%;object-fit:cover;object-position:50% 60%}
</style></head><body>
<div class="izq"><img class="emblema" src="${archivo(marca.emblema.webp.at(-2)[0])}">
<div><h1>Tu hogar<br>merece algo<em>extraordinario</em></h1></div>
<p>Salas · Sofás cama · Colchones · Bases cama</p></div>
<div class="der"><span class="marco"></span><img class="foto" src="${foto(HEROE.principal)}"></div>
</body></html>`;

const tmp = path.resolve('.cache/og.html');
fs.mkdirSync('.cache', { recursive: true });
fs.writeFileSync(tmp, html);
const nav = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await nav.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(tmp).href);
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth));
const png = await page.screenshot({ type: 'png' });
await nav.close();
await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toFile('public/og.jpg');
console.log('→ public/og.jpg', (fs.statSync('public/og.jpg').size / 1024).toFixed(0), 'KB');
