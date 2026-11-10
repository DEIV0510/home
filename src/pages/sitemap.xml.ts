import type { APIRoute } from 'astro';

// Sin dominio definitivo no se puede escribir una URL absoluta: el sitemap queda vacío
// (y robots.txt no lo anuncia). Con SITE_URL o en Vercel, lleva las tres páginas.
const RUTAS = ['/', '/privacidad/', '/terminos/'];

export const GET: APIRoute = ({ site }) => {
  const urls = site ? RUTAS.map((r) => new URL(r, site).href) : [];
  const cuerpo = urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${cuerpo}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
