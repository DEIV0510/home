// HOME PREMIUM — interacción del sitio. Un solo módulo diferido, sin librerías.
// Todo el HTML ya viene armado: este archivo solo mejora (sin JS, todo se ve y los enlaces
// de WhatsApp funcionan). La CSP prohíbe innerHTML/eval: solo API del DOM.
import { wa, mensajeQuiero, mensajeConsulta, mensajeColchon, MENSAJES, type DatosMensaje } from '../lib/mensajes';
import { precio as formatoPrecio, normalizar } from '../lib/formato';
import { LINEA_PRINCIPAL } from '../lib/empresa';

declare global {
  interface Window {
    __hpRespaldo?: number;
  }
}
// El JS llegó: se cancela el respaldo que mostraba todo a los 6 s.
clearTimeout(window.__hpRespaldo);

const d = document.documentElement;
const reducido = matchMedia('(prefers-reduced-motion: reduce)');
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const PRINCIPAL = LINEA_PRINCIPAL.internacional;
/** Antes de bajar a un ancla: el catálogo quita los filtros que la escondan (ver abajo). */
let irAntes: (destino: Element) => void = () => {};

/* ── Capas con historial: menú, líneas y visor ─────────────────────────────────────────────
   Cada capa abierta tiene su entrada en el historial: el botón/gesto «atrás» del teléfono la
   cierra en vez de sacar al visitante del sitio. Cerrar con la X hace history.back(). */
const pila: HTMLDialogElement[] = [];
let despues: (() => void) | null = null;

function abrirCapa(dlg: HTMLDialogElement) {
  if (dlg.open) return;
  dlg.showModal();
  pila.push(dlg);
  d.classList.add('capa-abierta');
  history.pushState({ ...(history.state ?? {}), hpCapa: dlg.id }, '');
}
function quitarCapa(dlg: HTMLDialogElement) {
  const i = pila.indexOf(dlg);
  if (i >= 0) pila.splice(i, 1);
  if (dlg.open) dlg.close();
  if (!pila.length) d.classList.remove('capa-abierta');
}
function cerrarCapa(dlg: HTMLDialogElement, luego?: () => void) {
  if (pila.at(-1) === dlg && history.state?.hpCapa === dlg.id) {
    despues = luego ?? null;
    history.back();
  } else {
    quitarCapa(dlg);
    luego?.();
  }
}
addEventListener('popstate', () => {
  const arriba = pila.at(-1);
  if (arriba && history.state?.hpCapa !== arriba.id) quitarCapa(arriba);
  const f = despues;
  despues = null;
  // Tras el popstate el navegador repone el scroll: lo siguiente va en el próximo cuadro.
  if (f) requestAnimationFrame(f);
});
for (const dlg of $$<HTMLDialogElement>('dialog')) {
  // Esc: cerrar por el historial.
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    cerrarCapa(dlg);
  });
  // Toque fuera del panel (en el fondo) o en un botón [data-cerrar].
  dlg.addEventListener('click', (e) => {
    const t = e.target as Element;
    if (t === dlg || t.closest('[data-cerrar]')) cerrarCapa(dlg);
  });
}

/* ── Cabecera, progreso y botón flotante ─────────────────────────────────────────────────── */
const cab = $('[data-cab]');
const heroe = $('#inicio');
const progreso = $('.progreso span');
const timelineNativo = CSS.supports('animation-timeline: scroll()');
let pendiente = false;
function alDesplazar() {
  if (pendiente) return;
  pendiente = true;
  requestAnimationFrame(() => {
    pendiente = false;
    const y = scrollY;
    cab?.classList.toggle('is-solida', y > 24 || !heroe);
    if (!timelineNativo && progreso) {
      const max = d.scrollHeight - innerHeight;
      progreso.style.setProperty('--progreso', String(max > 0 ? Math.min(1, y / max) : 0));
    }
  });
}
addEventListener('scroll', alDesplazar, { passive: true });
alDesplazar();

const flotante = $('[data-flotante]');
if (flotante) {
  if (heroe) {
    new IntersectionObserver(([e]) => flotante.classList.toggle('is-visible', !e.isIntersecting), { rootMargin: '-30% 0px 0px 0px' }).observe(heroe);
  } else flotante.classList.add('is-visible');
}

// Sección activa en el menú: la que cruza la mitad de la pantalla (ninguna si es otra, como
// «Colecciones» o «Instagram»).
const enlacesNav = $$<HTMLAnchorElement>('[data-nav]');
const secciones = enlacesNav.map((a) => document.getElementById(a.dataset.nav!)).filter((s): s is HTMLElement => Boolean(s));
let marcada = '';
function marcarSeccion() {
  const medio = innerHeight / 2;
  const activa = secciones.find((s) => {
    if (s.hidden) return false;
    const r = s.getBoundingClientRect();
    return r.top <= medio && r.bottom > medio;
  });
  const id = activa?.id ?? '';
  if (id === marcada) return;
  marcada = id;
  for (const a of enlacesNav) {
    if (a.dataset.nav === id) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  }
}
if (secciones.length) {
  addEventListener('scroll', () => requestAnimationFrame(marcarSeccion), { passive: true });
  // Medir recién después del primer pintado: leer posiciones al arrancar obligaría a armar el
  // diseño de toda la página dentro del script (tarea larga en celulares).
  addEventListener('load', () => setTimeout(marcarSeccion, 300), { once: true });
}

/* ── Menú móvil ──────────────────────────────────────────────────────────────────────────── */
const menu = $<HTMLDialogElement>('#menu');
$('[data-abrir-menu]')?.addEventListener('click', () => menu && abrirCapa(menu));
menu?.addEventListener('click', (e) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-nav-movil]');
  if (!a) return;
  const url = new URL(a.href);
  if (url.pathname !== location.pathname) return; // otra página: navegación normal
  e.preventDefault();
  cerrarCapa(menu, () => irA(url.hash));
});

/* ── Elegir línea de WhatsApp ────────────────────────────────────────────────────────────── */
const hojaLineas = $<HTMLDialogElement>('#lineas');
const textoLineas = hojaLineas && $('[data-lineas-texto]', hojaLineas);
const enlacesLinea = hojaLineas ? $$<HTMLAnchorElement>('[data-linea]', hojaLineas) : [];
document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-lineas]');
  if (!a || !hojaLineas || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  const mensaje = a.dataset.mensaje || MENSAJES.general;
  if (textoLineas) textoLineas.textContent = mensaje;
  for (const l of enlacesLinea) l.href = wa(l.dataset.linea!, mensaje);
  abrirCapa(hojaLineas);
});
// Elegida la línea, WhatsApp se abre en otra pestaña y la hoja se cierra.
for (const l of enlacesLinea) l.addEventListener('click', () => setTimeout(() => hojaLineas && cerrarCapa(hojaLineas), 250));

/* ── Visor de fotos ──────────────────────────────────────────────────────────────────────── */
type FotoVisor = [string, string, string, number, number, string];
const visor = $<HTMLDialogElement>('#visor');
const datosFotos: Record<string, FotoVisor[]> = JSON.parse($('#datos-fotos')?.textContent || '{}');
if (visor) {
  const pista = $('[data-visor-pista]', visor)!;
  const cuenta = $('[data-visor-cuenta]', visor)!;
  const ant = $<HTMLButtonElement>('[data-visor-ant]', visor)!;
  const sig = $<HTMLButtonElement>('[data-visor-sig]', visor)!;
  const actual = () => Math.round(pista.scrollLeft / Math.max(1, pista.clientWidth));
  const total = () => pista.children.length;
  const marcar = () => {
    const i = actual();
    cuenta.textContent = `${i + 1} / ${total()}`;
    ant.disabled = i <= 0;
    sig.disabled = i >= total() - 1;
    ant.parentElement!.hidden = total() < 2;
  };
  const mover = (paso: number) => pista.scrollBy({ left: paso * pista.clientWidth, behavior: reducido.matches ? 'auto' : 'smooth' });
  pista.addEventListener('scroll', () => requestAnimationFrame(marcar), { passive: true });
  ant.addEventListener('click', () => mover(-1));
  sig.addEventListener('click', () => mover(1));
  visor.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') mover(-1);
    if (e.key === 'ArrowRight') mover(1);
  });

  document.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-visor]');
    if (!b) return;
    const fotos = datosFotos[b.dataset.visor!];
    const tarjeta = b.closest<HTMLElement>('[data-producto]');
    if (!fotos?.length || !tarjeta) return;
    const nombre = tarjeta.dataset.nombre ?? '';
    pista.replaceChildren(
      ...fotos.map(([avif, webp, src, w, h, bg], i) => {
        const figura = document.createElement('figure');
        const pic = document.createElement('picture');
        const fuente = document.createElement('source');
        fuente.type = 'image/avif';
        fuente.srcset = avif;
        fuente.sizes = '100vw';
        const img = document.createElement('img');
        img.src = src;
        img.srcset = webp;
        img.sizes = '100vw';
        img.width = w;
        img.height = h;
        img.alt = fotos.length > 1 ? `${nombre}, foto ${i + 1} de ${fotos.length}` : nombre;
        img.decoding = 'async';
        // El color de la foto solo mientras carga: con object-fit: contain pintaría un recuadro.
        img.style.background = bg;
        img.addEventListener('load', () => img.style.removeProperty('background'), { once: true });
        pic.append(fuente, img);
        figura.append(pic);
        return figura;
      }),
    );
    $('[data-visor-nombre]', visor)!.textContent = nombre;
    const desde = $('[data-desde]', tarjeta);
    $('[data-visor-precio]', visor)!.textContent = `${desde && !desde.hidden ? 'Desde ' : ''}${$('[data-precio-texto]', tarjeta)?.textContent ?? ''}`;
    const quiero = $<HTMLAnchorElement>('[data-quiero]', tarjeta);
    $<HTMLAnchorElement>('[data-visor-cta]', visor)!.href = quiero?.href ?? wa(PRINCIPAL, MENSAJES.general);
    abrirCapa(visor);
    pista.scrollLeft = 0;
    marcar();
  });
}

/* ── Catálogo: filtros, buscador y orden ─────────────────────────────────────────────────── */
const catalogo = $('[data-catalogo]');
if (catalogo) {
  const items = $$('[data-producto]', catalogo);
  const grupos = $$('[data-grupo]', catalogo);
  const rejillas = $$('[data-rejilla]', catalogo);
  const chips = $$<HTMLButtonElement>('[data-filtro]', catalogo);
  const entrada = $<HTMLInputElement>('[data-buscar-input]', catalogo)!;
  const limpiar = $<HTMLButtonElement>('[data-buscar-limpiar]', catalogo)!;
  const selectOrden = $<HTMLSelectElement>('[data-ordenar]', catalogo)!;
  const resultado = $('[data-resultado]', catalogo)!;
  const vacio = $('[data-vacio]', catalogo)!;
  const cuerpo = $('.catalogo__cuerpo', catalogo)!;
  const barra = $('[data-barra]', catalogo)!;
  const filaChips = $('[data-chips]', catalogo)!;
  const FILTROS = new Set(chips.map((c) => c.dataset.filtro!));
  const ORDENES = new Set(['destacados', 'precio-asc', 'precio-desc']);

  const estado = { filtro: 'todo', q: '', orden: 'destacados' };

  // Alto de la barra fija: los grupos se detienen debajo al llegar por un ancla.
  new ResizeObserver(() => d.style.setProperty('--barra-h', `${barra.offsetHeight}px`)).observe(barra);
  filaChips.addEventListener(
    'scroll',
    () => filaChips.classList.toggle('is-final', filaChips.scrollLeft + filaChips.clientWidth >= filaChips.scrollWidth - 4),
    { passive: true },
  );

  const coincide = (el: HTMLElement) => {
    const cat = el.dataset.cat;
    const etiquetas = (el.dataset.etiquetas ?? '').split(' ');
    switch (estado.filtro) {
      case 'todo':
        return true;
      case 'salas':
        return cat === 'salas';
      case 'compacta':
      case 'en-l':
        return cat === 'salas' && etiquetas.includes(estado.filtro);
      default:
        return cat === estado.filtro;
    }
  };

  const ordenar = () => {
    for (const r of rejillas) {
      const hijos = [...r.children] as HTMLElement[];
      const clave = (el: HTMLElement) => Number(el.dataset.precio);
      hijos.sort((a, b) => {
        if (estado.orden === 'precio-asc') return clave(a) - clave(b) || Number(a.dataset.orden) - Number(b.dataset.orden);
        if (estado.orden === 'precio-desc') return clave(b) - clave(a) || Number(a.dataset.orden) - Number(b.dataset.orden);
        return Number(a.dataset.orden) - Number(b.dataset.orden);
      });
      r.append(...hijos);
    }
  };

  const aplicar = () => {
    const palabras = normalizar(estado.q).split(/\s+/).filter(Boolean);
    let n = 0;
    let visibles = 0;
    for (const el of items) {
      const ok = coincide(el) && palabras.every((p) => (el.dataset.buscar ?? '').includes(p));
      el.hidden = !ok;
      if (ok) visibles++;
      if (ok && Number(el.dataset.precio) > 0) n++;
    }
    for (const g of grupos) {
      const suyos = $$('[data-producto]', g);
      const cuantos = suyos.filter((el) => !el.hidden).length;
      g.hidden = cuantos === 0;
      const etiqueta = $('[data-grupo-n]', g);
      if (etiqueta && g.dataset.grupo !== 'colchones') etiqueta.textContent = `${cuantos} ${cuantos === 1 ? 'modelo' : 'modelos'}`;
    }
    for (const c of chips) c.setAttribute('aria-pressed', String(c.dataset.filtro === estado.filtro));
    limpiar.hidden = !estado.q;
    vacio.hidden = visibles > 0;
    if (!visibles) {
      $('[data-vacio-q]', vacio)!.textContent = estado.q;
      const enlace = $<HTMLAnchorElement>('[data-vacio-wa]', vacio)!;
      const mensaje = estado.q ? MENSAJES.busqueda(estado.q) : MENSAJES.general;
      enlace.dataset.mensaje = mensaje;
      enlace.href = wa(PRINCIPAL, mensaje);
    }
    const sufijo = estado.q ? ` para «${estado.q}»` : '';
    resultado.textContent = `${n} ${n === 1 ? 'producto' : 'productos'}${sufijo}`;
    // La dirección guarda el filtro (sirve para enlazar desde un anuncio: /?filtro=en-l).
    const url = new URL(location.href);
    estado.filtro === 'todo' ? url.searchParams.delete('filtro') : url.searchParams.set('filtro', estado.filtro);
    estado.q ? url.searchParams.set('q', estado.q) : url.searchParams.delete('q');
    estado.orden === 'destacados' ? url.searchParams.delete('orden') : url.searchParams.set('orden', estado.orden);
    if (url.href !== location.href) history.replaceState(history.state, '', url);
  };

  const enPantalla = (el: HTMLElement) => {
    if (el.hidden) return false;
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight && r.width > 0;
  };
  // Si el catálogo quedó arriba (se filtró desde abajo), vuelve al inicio de los resultados.
  const subirAResultados = () => {
    const tope = cuerpo.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(d).getPropertyValue('--cab-h')) || 64) - barra.offsetHeight;
    if (scrollY > tope + 4) scrollTo({ top: tope, behavior: 'instant' });
  };

  /** Cambia el catálogo con transición: las tarjetas que siguen se deslizan a su nuevo lugar. */
  const conTransicion = (cambio: () => void) => {
    if (!document.startViewTransition || reducido.matches) {
      cambio();
      return;
    }
    const nombrar = () => items.filter(enPantalla).forEach((el) => (el.style.viewTransitionName = `p-${el.dataset.id}`));
    nombrar();
    const t = document.startViewTransition(() => {
      cambio();
      nombrar();
    });
    t.finished.finally(() => items.forEach((el) => (el.style.viewTransitionName = '')));
  };

  for (const c of chips) {
    c.addEventListener('click', () => {
      if (estado.filtro === c.dataset.filtro) return;
      conTransicion(() => {
        estado.filtro = c.dataset.filtro!;
        aplicar();
        subirAResultados();
      });
      // La ficha elegida a la vista en la fila deslizable (celular), sin mover la página.
      const fila = filaChips.getBoundingClientRect();
      const r = c.getBoundingClientRect();
      if (r.left < fila.left || r.right > fila.right) filaChips.scrollBy({ left: r.left - fila.left - 24, behavior: reducido.matches ? 'auto' : 'smooth' });
    });
  }
  let espera = 0;
  entrada.addEventListener('input', () => {
    clearTimeout(espera);
    espera = window.setTimeout(() => {
      estado.q = entrada.value.trim().slice(0, 60);
      aplicar();
    }, 120);
  });
  entrada.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      entrada.blur();
      subirAResultados();
    }
  });
  limpiar.addEventListener('click', () => {
    entrada.value = '';
    estado.q = '';
    aplicar();
    entrada.focus();
  });
  selectOrden.addEventListener('change', () => {
    conTransicion(() => {
      estado.orden = ORDENES.has(selectOrden.value) ? selectOrden.value : 'destacados';
      ordenar();
      aplicar();
    });
  });
  const verTodo = () => {
    estado.filtro = 'todo';
    estado.q = '';
    entrada.value = '';
    aplicar();
  };
  $('[data-ver-todo]', catalogo)?.addEventListener('click', () => {
    verTodo();
    subirAResultados();
  });

  // Enlaces a un grupo o producto del catálogo (menú, categorías, portada): si un filtro lo
  // esconde, se quitan los filtros antes de que el navegador baje hasta él.
  irAntes = (destino: Element) => {
    if (catalogo.contains(destino) && (estado.filtro !== 'todo' || estado.q)) verTodo();
  };

  // Estado inicial desde la dirección (?filtro=en-l&q=nube&orden=precio-asc).
  const params = new URLSearchParams(location.search);
  const f = params.get('filtro');
  const q = params.get('q');
  const o = params.get('orden');
  if (f && FILTROS.has(f)) estado.filtro = f;
  if (q) {
    estado.q = q.slice(0, 60);
    entrada.value = estado.q;
  }
  if (o && ORDENES.has(o)) {
    estado.orden = o;
    selectOrden.value = o;
    ordenar();
  }
  if (f || q || o) aplicar();

  // Medida elegida (productos con `medidas`) y tipo de colchón: cambian precio y mensajes.
  catalogo.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    const tarjeta = input.closest<HTMLElement>('[data-producto]');
    if (!tarjeta) return;
    let quiero = '';
    let consulta = '';
    if (input.dataset.tipoColchon !== undefined) {
      quiero = consulta = mensajeColchon(input.value, tarjeta.dataset.medida ?? '', tarjeta.dataset.precioFmt ?? '');
    } else if (input.dataset.precio) {
      const valor = formatoPrecio(Number(input.dataset.precio));
      const texto = $('[data-precio-texto]', tarjeta)!;
      texto.textContent = valor;
      texto.animate?.([{ opacity: 0.2, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: reducido.matches ? 1 : 320, easing: 'ease-out' });
      const desde = $('[data-desde]', tarjeta);
      if (desde) desde.hidden = true;
      const datos: DatosMensaje = { articulo: tarjeta.dataset.articulo as 'la' | 'el', nombre: tarjeta.dataset.nombre ?? '', precio: valor, medida: Number(input.value) };
      quiero = mensajeQuiero(datos);
      consulta = mensajeConsulta(datos, tarjeta.dataset.foto === '1');
    } else return;
    for (const a of $$<HTMLAnchorElement>('[data-quiero]', tarjeta)) a.href = wa(PRINCIPAL, quiero);
    for (const a of $$<HTMLAnchorElement>('[data-consulta]', tarjeta)) {
      a.href = wa(PRINCIPAL, consulta);
      a.dataset.mensaje = consulta;
    }
  });
}

/* ── Anclas internas ─────────────────────────────────────────────────────────────────────── */
function irA(hash: string) {
  const destino = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  if (!destino) return;
  irAntes(destino);
  history.pushState(history.state, '', hash);
  destino.scrollIntoView({ behavior: reducido.matches ? 'auto' : 'smooth', block: 'start' });
}
document.addEventListener(
  'click',
  (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!a || a.closest('dialog')) return;
    const url = new URL(a.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const destino = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (destino) irAntes(destino);
  },
  true,
);
// Llegada con ancla a un producto/grupo escondido por un filtro de la dirección.
if (location.hash) {
  const destino = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (destino) irAntes(destino);
}

/* ── Aparición al hacer scroll ───────────────────────────────────────────────────────────── */
// (El escalonado por columna de las rejillas va en CSS: Catalogo.astro.)
const revelar = new IntersectionObserver(
  (entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-visible');
      revelar.unobserve(e.target);
    }
  },
  { rootMargin: '0px 0px -6% 0px', threshold: 0.06 },
);
$$('.revela').forEach((el) => revelar.observe(el));
