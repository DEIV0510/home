import { defineConfig } from 'astro/config';

// Dominio público: no se inventa. Sale de SITE_URL (definido a mano al compilar) o del dominio
// de producción que entrega Vercel en el build. Sin dominio no hay canonical, og:url absoluto
// ni URLs en el sitemap (ver docs/PENDIENTES.md).
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = process.env.SITE_URL || (vercel ? `https://${vercel}` : undefined);

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // CSS en línea: una petición bloqueante menos.
    inlineStylesheets: 'always',
  },
  // Los componentes que reciben `class` heredan el alcance del padre.
  scopedStyleStrategy: 'class',
  compressHTML: true,
  devToolbar: { enabled: false },
  server: { port: 5640, host: true },
});
