// Capturas de revisión con Chrome real (playwright-core): celular 390×844 y escritorio 1440×900.
// Uso: node scripts/qa/capturas.mjs [url] [carpeta]
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const URL = process.argv[2] || 'http://localhost:5641/';
const OUT = process.argv[3] || '.cache/qa/capturas';
fs.mkdirSync(OUT, { recursive: true });
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const navegador = await chromium.launch({ executablePath: CHROME, headless: true });
const errores = [];

for (const [nombre, opciones] of [
  ['movil', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
  ['escritorio', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
]) {
  const ctx = await navegador.newContext({ ...opciones, reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errores.push(`[${nombre}] consola ${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => errores.push(`[${nombre}] pageerror: ${e.message}`));
  page.on('requestfailed', (r) => errores.push(`[${nombre}] fallo ${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => r.status() >= 400 && errores.push(`[${nombre}] HTTP ${r.status()} ${r.url()}`));

  await page.goto(URL, { waitUntil: 'load' });
  // Pantalla de carga: captura a mitad y espera a que salga.
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT}/${nombre}-00-carga.png` });
  await page.waitForFunction(() => !document.documentElement.classList.contains('con-intro'), null, { timeout: 6000 });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${OUT}/${nombre}-01-portada.png` });

  // Recorre la página para disparar las apariciones y la carga diferida.
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < alto; y += 500) {
    await page.evaluate((v) => scrollTo(0, v), y);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(900);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 15000 }).catch(async () => errores.push(`[${nombre}] imágenes sin terminar: ${(await page.evaluate(() => [...document.images].filter((i) => !i.complete).map((i) => (i.currentSrc || i.src).split('/').pop() + ' ' + i.loading + ' ' + Math.round(i.getBoundingClientRect().top + scrollY)))).join(', ')}`));
  for (const [id, sufijo] of [
    ['#categorias', '02-categorias'],
    ['#catalogo', '03-catalogo'],
    ['#sofas-cama', '04-sofas'],
    ['#colchones', '05-colchon'],
    ['#otros-muebles', '06-otros'],
    ['#por-que', '07-confianza'],
    ['#instagram', '08-instagram'],
    ['#contacto', '09-contacto'],
  ]) {
    await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'start', behavior: 'instant' }), id);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/${nombre}-${sufijo}.png` });
  }
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${nombre}-10-pie.png` });

  // Desbordes horizontales.
  const desborde = await page.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const fuera = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > W + 1 || r.left < -1)) {
        let p = el.parentElement, enScroll = false;
        while (p) {
          const s = getComputedStyle(p);
          if (/(auto|scroll|hidden|clip)/.test(s.overflowX) && p !== document.body && p !== document.documentElement) { enScroll = true; break; }
          p = p.parentElement;
        }
        if (!enScroll) fuera.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} → ${Math.round(r.left)}..${Math.round(r.right)}`);
      }
    }
    return { scrollW: document.documentElement.scrollWidth, W, fuera: fuera.slice(0, 15) };
  });
  console.log(nombre, 'ancho', desborde.W, 'scrollWidth', desborde.scrollW, desborde.fuera.length ? desborde.fuera : 'sin desbordes');
  await ctx.close();
}
await navegador.close();
console.log(errores.length ? errores.join('\n') : 'Sin errores de consola ni de red');
