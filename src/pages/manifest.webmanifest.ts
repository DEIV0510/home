import type { APIRoute } from 'astro';
import marca from '../data/marca.json';

export const GET: APIRoute = () => {
  const iconos = marca
    ? [
        { src: marca.iconos.i192, sizes: '192x192', type: 'image/png' },
        { src: marca.iconos.i512, sizes: '512x512', type: 'image/png' },
        { src: marca.iconos.m512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ]
    : [];
  const manifiesto = {
    name: 'HOME PREMIUM',
    short_name: 'HOME PREMIUM',
    description: 'Fábrica de muebles: salas, sofás cama, colchones y bases cama.',
    lang: 'es-CO',
    start_url: '/',
    display: 'browser',
    background_color: '#151515',
    theme_color: '#151515',
    icons: iconos,
  };
  return new Response(JSON.stringify(manifiesto, null, 2), { headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' } });
};
