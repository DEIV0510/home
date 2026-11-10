// Pruebas de interacción con Chrome real contra el build (serve-dist). Uso:
//   node scripts/qa/interaccion.mjs [url]
// Cubre: catálogo completo y precios exactos, cada enlace de WhatsApp (número, mensaje
// codificado y texto esperado), filtros, buscador, orden, colchón, hoja de líneas,
// visor, menú móvil, botón atrás, anclas con filtros, flotante, pantalla de carga, sin JS.
import { chromium } from 'playwright-core';
import { PRODUCTOS, COLCHON } from '../../src/data/catalogo.ts';
import { mensajeQuiero, mensajeColchon, MENSAJES } from '../../src/lib/mensajes.ts';
import { precio } from '../../src/lib/formato.ts';

const URL_BASE = process.argv[2] || 'http://localhost:5641/';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const NUMEROS = ['573224083402', '573223049079'];
let ok = 0;
const fallos = [];
const prueba = (cond, msg) => (cond ? ok++ : fallos.push(msg));

// El listado del brief, tal cual (26 salas + 2 sofás cama).
const BRIEF = [
  ['Sala Charleston', '$999.999'], ['Sala cubo pequeña', '$1.049.000'], ['Sala riñonera', '$1.099.999'], ['Sala riñonera rajada', '$1.099.999'],
  ['Sala Dubai', '$1.099.999'], ['Sala cubo grande', '$1.199.000'], ['Sala L', '$1.299.999'], ['Sala Barcelona', '$1.299.999'],
  ['Sala Ibiza 2.0', '$1.299.999'], ['Sala Paredes', '$1.299.999'], ['Sala Roma', '$1.299.999'], ['Sala Madrid', '$1.299.999'],
  ['Sala Suiza 2.0', '$1.299.999'], ['Sala Audi', '$1.349.999'], ['Sala brazo en H', '$1.399.999'], ['Sala Tokio', '$1.499.999'],
  ['Sala Texas', '$1.599.999'], ['Sala Miami', '$1.599.999'], ['Sala Nube', '$1.699.999'], ['Sala L Baúl', '$1.709.999'],
  ['Sala Múnich', '$1.699.999'], ['Sala huevo', '$2.129.999'], ['Sala Milán', '$2.199.999'], ['Sala huevo con carro', '$2.299.999'],
  ['Sala Milán 2.0', '$2.399.999'], ['Sala Oslo', '$1.149.999'],
  ['Sofá cama de 1.50 m de ancho', '$1.249.999'], ['Sofá cama de 1.80 m de ancho', '$1.299.999'],
];

const navegador = await chromium.launch({ executablePath: CHROME, headless: true });
const errores = [];
async function nueva(opts = {}) {
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'no-preference', ...opts });
  const page = await ctx.newPage();
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errores.push(`consola ${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`));
  page.on('response', (r) => r.status() >= 400 && errores.push(`HTTP ${r.status()} ${r.url()}`));
  return { ctx, page };
}
const listo = (page) => page.waitForFunction(() => !document.documentElement.classList.contains('con-intro'), null, { timeout: 8000 });
const textoWa = (href) => new URL(href).searchParams.get('text');
const visibles = (page, sel) => page.$$eval(sel, (els) => els.filter((e) => e.offsetParent !== null || getComputedStyle(e).position === 'fixed').length);

// ── 1. Pantalla de carga: primera visita sí, recarga no ─────────────────────────────────
{
  const { ctx, page } = await nueva();
  await page.goto(URL_BASE);
  prueba(await page.evaluate(() => document.documentElement.classList.contains('con-intro')), 'carga: no apareció en la primera visita');
  const t0 = Date.now();
  await listo(page);
  const dura = Date.now() - t0;
  prueba(dura < 3200, `carga: tardó ${dura} ms en salir`);
  prueba((await page.$('#carga')) === null, 'carga: el elemento no se quitó');
  await page.reload();
  prueba(!(await page.evaluate(() => document.documentElement.classList.contains('con-intro'))), 'carga: se repitió al recargar en la misma sesión');
  await ctx.close();
}
{
  const { ctx, page } = await nueva({ reducedMotion: 'reduce' });
  await page.goto(URL_BASE);
  prueba(await page.evaluate(() => document.documentElement.classList.contains('con-intro')), 'carga (movimiento reducido): no apareció');
  const t0 = Date.now();
  await listo(page);
  prueba(Date.now() - t0 < 2000, 'carga (movimiento reducido): demasiado larga');
  await ctx.close();
}
{
  const { ctx, page } = await nueva();
  await page.goto(URL_BASE + '#colchones');
  prueba(!(await page.evaluate(() => document.documentElement.classList.contains('con-intro'))), 'carga: apareció al llegar con ancla');
  await ctx.close();
}

// ── 2. Catálogo, precios y WhatsApp ─────────────────────────────────────────────────────
const { ctx, page } = await nueva();
await page.goto(URL_BASE);
await listo(page);
// Tarjetas (con foto, en el carrusel) y filas de la carta (sin foto).
const tarjetas = await page.$$eval('[data-producto][data-nombre]', (els) =>
  els.map((e) => ({
    id: e.dataset.id,
    cat: e.dataset.cat,
    nombre: (e.querySelector('h4, .fila__nombre')?.textContent ?? '').trim(),
    precio: e.querySelector('[data-precio-texto]').textContent.trim(),
    quiero: e.querySelector('[data-quiero]').href,
    consulta: e.querySelector('[data-consulta]').href,
    foto: e.dataset.foto,
    tipo: e.matches('.tarjeta') ? 'tarjeta' : 'fila',
  })),
);
prueba(tarjetas.every((t) => (t.foto === '1') === (t.tipo === 'tarjeta')), 'un producto con foto quedó en la carta o uno sin foto en el carrusel');
prueba(tarjetas.filter((t) => t.tipo === 'fila').every((t) => textoWa(t.consulta).startsWith('Hola, ¿me pueden enviar fotos')), 'las filas sin foto no piden fotos');
const salas = tarjetas.filter((t) => t.cat === 'salas');
prueba(salas.length === 26, `salas: hay ${salas.length}, deben ser las 26 del brief`);
for (const [nombre, valor] of BRIEF) {
  const t = tarjetas.find((x) => x.nombre === nombre);
  prueba(t, `falta «${nombre}»`);
  if (t) prueba(t.precio === valor, `precio de «${nombre}»: ${t.precio} ≠ ${valor}`);
}
prueba(new Set(tarjetas.map((t) => t.id)).size === tarjetas.length, 'hay productos duplicados');
prueba(tarjetas.filter((t) => t.cat === 'sofas-cama').length === 2, 'sofás cama ≠ 2');
prueba(!tarjetas.some((t) => /base-cama|sala-l-baul-.*sofa-cama/.test(t.id)), 'quedó una base cama o un combo (los quitó el cliente)');
for (const p of PRODUCTOS) {
  const t = tarjetas.find((x) => x.id === p.id);
  if (!t) continue;
  const esperado = mensajeQuiero({ articulo: p.articulo, nombre: p.nombre, precio: precio(p.precio) });
  prueba(textoWa(t.quiero) === esperado, `mensaje «Quiero este» de ${p.nombre}: ${textoWa(t.quiero)}`);
}
// Mensaje del brief, literal.
const charleston = tarjetas.find((t) => t.id === 'sala-charleston');
prueba(textoWa(charleston.quiero) === 'Hola, estoy interesado en la Sala Charleston de $999.999 de HOME PREMIUM. ¿Me pueden brindar más información y disponibilidad?', 'mensaje literal de la Sala Charleston');
const colchonQuiero = await page.$eval('#p-colchon [data-quiero]', (a) => a.href);
prueba(textoWa(colchonQuiero) === 'Hola, quisiera información sobre el colchón ortopédico de 1.40 × 1.90 m de HOME PREMIUM por $799.999', `mensaje literal del colchón: ${textoWa(colchonQuiero)}`);
prueba(textoWa(colchonQuiero) === mensajeColchon('ortopédico', COLCHON.medida, precio(COLCHON.precio)), 'colchón: mensaje distinto al de la librería');

// Todos los enlaces de WhatsApp de la página.
const enlacesWa = await page.$$eval('a[href*="wa.me"]', (as) => as.map((a) => ({ href: a.getAttribute('href'), target: a.target, rel: a.rel })));
for (const e of enlacesWa) {
  const u = new URL(e.href);
  prueba(u.hostname === 'wa.me' && NUMEROS.includes(u.pathname.slice(1)), `WhatsApp con número raro: ${e.href.slice(0, 60)}`);
  prueba(Boolean(u.searchParams.get('text')), `WhatsApp sin mensaje: ${e.href.slice(0, 60)}`);
  prueba(!/[\s¿?¡áéíóúñ×«»$]/.test(e.href.split('?text=')[1] ?? ''), `mensaje sin codificar: ${e.href.slice(0, 70)}`);
  prueba(e.target === '_blank' && e.rel.includes('noopener'), `WhatsApp sin _blank/noopener: ${e.href.slice(0, 50)}`);
}
for (const n of NUMEROS) prueba(enlacesWa.some((e) => e.href.includes(`wa.me/${n}`)), `ningún enlace a ${n}`);
for (const n of NUMEROS) prueba(await page.$(`a[href="tel:+${n}"]`), `falta tel:+${n}`);
prueba((await page.$$('a[href="https://www.instagram.com/home_premium01/"]')).length >= 3, 'Instagram: faltan enlaces');
prueba((await page.textContent('#instagram')).includes('Visitar Instagram') || (await page.textContent('#instagram')).toUpperCase().includes('VISITAR INSTAGRAM'), 'Instagram: falta el botón');

// ── 3. Filtros ──────────────────────────────────────────────────────────────────────────
const contarTarjetas = () => page.$$eval('[data-producto]', (els) => els.filter((e) => !e.hidden && !e.closest('[hidden]')).length);
const ESPERA = {
  todo: PRODUCTOS.length + 1 + 2,
  salas: 26,
  compacta: PRODUCTOS.filter((p) => p.etiquetas?.includes('compacta')).length,
  'en-l': PRODUCTOS.filter((p) => p.etiquetas?.includes('en-l')).length,
  'sofas-cama': 2,
  colchones: 1,
};
for (const [f, n] of Object.entries(ESPERA)) {
  await page.click(`[data-filtro="${f}"]`);
  await page.waitForTimeout(650);
  const vistos = await contarTarjetas();
  prueba(vistos === n, `filtro ${f}: ${vistos} visibles, se esperaban ${n}`);
  prueba((await page.getAttribute(`[data-filtro="${f}"]`, 'aria-pressed')) === 'true', `filtro ${f}: no queda marcado`);
  if (f !== 'todo') prueba(page.url().includes(`filtro=${f}`), `filtro ${f}: no queda en la dirección`);
}
// Filtro desde la dirección (enlace de anuncio).
await page.goto(URL_BASE + '?filtro=en-l');
prueba((await contarTarjetas()) === ESPERA['en-l'], 'filtro desde la dirección (?filtro=en-l) no se aplicó');
await page.goto(URL_BASE);

// ── 4. Buscador ─────────────────────────────────────────────────────────────────────────
for (const [q, esperado] of [
  ['munich', ['Sala Múnich']],
  ['RIÑONERA', ['Sala riñonera', 'Sala riñonera rajada']],
  ['milan 2', ['Sala Milán 2.0']],
  ['colchon', ['colchon']],
  ['comedor', ['comedores']],
]) {
  await page.fill('[data-buscar-input]', q);
  await page.waitForTimeout(350);
  const res = await page.$$eval('[data-producto]', (els) => els.filter((e) => !e.hidden).map((e) => e.dataset.nombre || e.dataset.id));
  prueba(JSON.stringify(res.sort()) === JSON.stringify([...esperado].sort()), `buscar «${q}»: ${res.join(', ')}`);
}
await page.fill('[data-buscar-input]', 'xyz123');
await page.waitForTimeout(350);
prueba(!(await page.$eval('[data-vacio]', (e) => e.hidden)), 'buscar sin resultados: no aparece el aviso');
const vacioWa = await page.$eval('[data-vacio-wa]', (a) => a.href);
prueba(textoWa(vacioWa) === MENSAJES.busqueda('xyz123'), 'buscar sin resultados: el WhatsApp no lleva la búsqueda');
await page.click('[data-buscar-limpiar]');
await page.waitForTimeout(350);
prueba((await contarTarjetas()) === ESPERA.todo, 'limpiar búsqueda no devuelve todo');

// ── 5. Orden ────────────────────────────────────────────────────────────────────────────
// Cada lista (carrusel y carta) se ordena por separado.
const preciosSalas = () => page.$$eval('[data-grupo="salas"] [data-rejilla]', (rs) => rs.map((r) => [...r.children].map((e) => Number(e.dataset.precio))));
await page.selectOption('[data-ordenar]', 'precio-asc');
await page.waitForTimeout(600);
let ps = await preciosSalas();
prueba(ps.length === 2 && ps.every((l) => l.every((v, i) => i === 0 || l[i - 1] <= v)), 'orden menor precio falla');
await page.selectOption('[data-ordenar]', 'precio-desc');
await page.waitForTimeout(600);
ps = await preciosSalas();
prueba(ps.every((l) => l.every((v, i) => i === 0 || l[i - 1] >= v)), 'orden mayor precio falla');
await page.selectOption('[data-ordenar]', 'precio-asc');
await page.waitForTimeout(600);

// ── 6. Tipo de colchón ──────────────────────────────────────────────────────────────────
await page.click('#p-colchon .colchon__tipo label:nth-child(3)');
const semi = await page.$eval('#p-colchon [data-quiero]', (a) => a.href);
prueba(textoWa(semi) === mensajeColchon('semiortopédico', COLCHON.medida, precio(COLCHON.precio)), `colchón semiortopédico: ${textoWa(semi)}`);

// ── 6b. Carta plegable (celular) y carrusel ────────────────────────────────────────────
await page.evaluate(() => scrollTo(0, 0));
const filasVisibles = () => page.$$eval('[data-grupo="salas"] .fila', (els) => els.filter((e) => e.offsetParent !== null).length);
const sinFotoSalas = PRODUCTOS.filter((p) => p.categoria === 'salas').length - tarjetas.filter((t) => t.cat === 'salas' && t.tipo === 'tarjeta').length;
prueba((await filasVisibles()) === Math.min(6, sinFotoSalas), `carta plegada: ${await filasVisibles()} filas a la vista`);
await page.click('[data-grupo="salas"] [data-carta-mas]');
await page.waitForTimeout(200);
prueba((await filasVisibles()) === sinFotoSalas, 'carta: «Ver los N modelos» no despliega todo');
const riel = '[data-grupo="salas"] [data-riel]';
await page.$eval(riel, (r) => r.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(300);
prueba(await page.$eval('[data-grupo="salas"] [data-riel-ant]', (b) => b.disabled), 'carrusel: «anteriores» activo al inicio');
await page.click('[data-grupo="salas"] [data-riel-sig]');
await page.waitForTimeout(900);
prueba((await page.$eval(riel, (r) => r.scrollLeft)) > 100, 'carrusel: «siguientes» no avanza');
prueba(!(await page.$eval('[data-grupo="salas"] [data-riel-ant]', (b) => b.disabled)), 'carrusel: «anteriores» sigue apagado tras avanzar');
const totalFotosCarrusel = (await page.$$(`${riel} img`)).length;
const fotosCarrusel = await page.$$eval(`${riel} img`, (is) => is.filter((i) => i.complete && i.naturalWidth > 0).length);
prueba(fotosCarrusel === totalFotosCarrusel, `carrusel: ${fotosCarrusel} fotos cargadas de ${totalFotosCarrusel}`);

// ── 7. Hoja de líneas + botón atrás ─────────────────────────────────────────────────────
const urlAntes = page.url();
await page.click('#p-sala-charleston [data-consulta]');
await page.waitForTimeout(400);
prueba(await page.$eval('#lineas', (d) => d.open), 'líneas: no abre');
const lineas = await page.$$eval('#lineas [data-linea]', (as) => as.map((a) => a.href));
prueba(lineas.length === 2 && NUMEROS.every((n, i) => lineas[i].includes(`wa.me/${n}`)), 'líneas: números incorrectos');
prueba(lineas.every((h) => textoWa(h).includes('Sala Charleston')), 'líneas: el mensaje no es el del producto');
await page.goBack();
await page.waitForTimeout(400);
prueba(!(await page.$eval('#lineas', (d) => d.open)), 'líneas: «atrás» no la cierra');
prueba(page.url() === urlAntes, 'líneas: «atrás» sacó de la página');

// ── 8. Visor ────────────────────────────────────────────────────────────────────────────
await page.click('#p-sala-l [data-visor]');
await page.waitForTimeout(450);
prueba(await page.$eval('#visor', (d) => d.open), 'visor: no abre');
prueba((await page.$$('#visor figure')).length === 2, 'visor: no muestra las 2 fotos de la Sala L');
prueba((await page.textContent('[data-visor-cuenta]')).trim() === '1 / 2', 'visor: contador inicial');
await page.click('[data-visor-sig]');
await page.waitForTimeout(700);
prueba((await page.textContent('[data-visor-cuenta]')).trim() === '2 / 2', 'visor: «siguiente» no avanza');
const imgVisor = await page.$eval('#visor figure img', (i) => getComputedStyle(i).objectFit);
prueba(imgVisor === 'contain', 'visor: la foto no se muestra completa');
await page.goBack();
await page.waitForTimeout(400);
prueba(!(await page.$eval('#visor', (d) => d.open)), 'visor: «atrás» no lo cierra');

// ── 9. Menú móvil ───────────────────────────────────────────────────────────────────────
await page.evaluate(() => scrollTo(0, 0));
await page.click('[data-abrir-menu]');
await page.waitForTimeout(600);
prueba(await page.$eval('#menu', (d) => d.open), 'menú: no abre');
await page.click('#menu a[href="#colchones"]');
await page.waitForTimeout(1500);
prueba(!(await page.$eval('#menu', (d) => d.open)), 'menú: no se cierra al elegir');
const topColchones = await page.$eval('#colchones', (e) => Math.round(e.getBoundingClientRect().top));
prueba(topColchones >= 60 && topColchones < 260, `menú → Colchones: quedó en ${topColchones}px`);
prueba(page.url().endsWith('#colchones'), 'menú: la dirección no cambió a #colchones');

// ── 10. Ancla con un filtro activo ──────────────────────────────────────────────────────
await page.click('[data-filtro="en-l"]');
await page.waitForTimeout(600);
await page.evaluate(() => document.querySelector('#categorias').scrollIntoView());
await page.click('#categorias a[href="#sofas-cama"]');
await page.waitForTimeout(1500);
prueba(!(await page.$eval('#sofas-cama', (e) => e.hidden)), 'categoría con filtro activo: el grupo sigue oculto');
prueba((await page.getAttribute('[data-filtro="todo"]', 'aria-pressed')) === 'true', 'categoría con filtro activo: no quitó el filtro');

// ── 11. Flotante y cabecera ─────────────────────────────────────────────────────────────
await page.evaluate(() => scrollTo(0, 0));
await page.waitForTimeout(400);
prueba(!(await page.$eval('[data-flotante]', (e) => e.classList.contains('is-visible'))), 'flotante: visible sobre la portada');
await page.evaluate(() => scrollTo(0, 2500));
await page.waitForTimeout(600);
prueba(await page.$eval('[data-flotante]', (e) => e.classList.contains('is-visible')), 'flotante: no aparece al bajar');
prueba(await page.$eval('[data-cab]', (e) => e.classList.contains('is-solida')), 'cabecera: no se vuelve sólida al bajar');
await page.click('[data-flotante]');
await page.waitForTimeout(400);
prueba(await page.$eval('#lineas', (d) => d.open), 'flotante: no abre la elección de línea');
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
prueba(!(await page.$eval('#lineas', (d) => d.open)), 'Esc no cierra la hoja');
await ctx.close();

// ── 12. Escritorio: menú visible, sin botón de menú ─────────────────────────────────────
{
  const { ctx, page } = await nueva({ viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });
  await page.goto(URL_BASE);
  await listo(page);
  prueba((await visibles(page, '.cab__nav a')) === 6, 'escritorio: el menú no muestra 6 enlaces');
  prueba(await page.isVisible('.cab__cta'), 'escritorio: falta «Consultar por WhatsApp»');
  prueba(!(await page.isVisible('[data-abrir-menu]')), 'escritorio: se ve el botón Menú');
  await ctx.close();
}

// ── 13. Sin JavaScript: todo visible y los enlaces sirven ───────────────────────────────
{
  const { ctx, page } = await nueva({ javaScriptEnabled: false });
  await page.goto(URL_BASE);
  const ocultos = await page.$$eval('.revela', (els) => els.filter((e) => getComputedStyle(e).opacity === '0').length);
  prueba(ocultos === 0, `sin JS: ${ocultos} bloques invisibles`);
  prueba((await page.$$('[data-producto][data-nombre]')).length === PRODUCTOS.length, 'sin JS: faltan productos');
  prueba(!(await page.isVisible('#carga')), 'sin JS: se ve la pantalla de carga');
  await ctx.close();
}

await navegador.close();
for (const e of errores) fallos.push(e);
console.log(`${ok} comprobaciones correctas, ${fallos.length} fallos`);
if (fallos.length) {
  console.log(fallos.map((f) => `✗ ${f}`).join('\n'));
  process.exit(1);
}
