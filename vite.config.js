import { defineConfig } from 'vite';
// cubing.js runs its search (scrambles, short solutions) in a module worker that shares chunks with the
// page. The preload polyfill is off and Vite's import helper gets its own chunk, so the worker never
// loads the page entry (which touches `document`, absent in workers).
export default defineConfig({
  base: './',
  server: {
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/catalog-source/**'] },
  },
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    modulePreload: false,
    rollupOptions: { output: { manualChunks: id => (id.includes('vite/preload-helper') ? 'vite-helper' : undefined) } },
  },
});
