import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';

/**
 * GitHub Pages cannot rewrite routes; it serves 404.html for unknown paths instead.
 * Shipping a copy of index.html as 404.html makes /projects/<slug> work on a direct
 * visit or refresh there too. (Netlify and Vercel use public/_redirects and vercel.json.)
 */
function spaFallback404() {
  let outDir = 'dist';
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const index = path.join(outDir, 'index.html');
      if (fs.existsSync(index)) fs.copyFileSync(index, path.join(outDir, '404.html'));
    }
  };
}

export default defineConfig({
  // Absolute URLs from the site root. Required because case studies live at /projects/<slug>,
  // where relative URLs would break. For a GitHub Pages *project* site (user.github.io/repo/)
  // build with:  npx vite build --base=/repo/
  base: '/',
  plugins: [spaFallback404()],
  build: {
    // Mermaid ships many lazily-loaded diagram chunks (one is ~1.5 MB, loaded only if a diagram needs
    // that layout engine). None of them are part of the initial page load.
    chunkSizeWarningLimit: 1600
  },
  server: {
    open: true // open the site in the browser on `npm run dev`
  }
});
