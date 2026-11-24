/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Content-Security-Policy chỉ chèn vào bản build: dev server của Vite cần
 * inline script (React Fast Refresh) nên không áp dụng khi `npm run dev`.
 * - script-src 'wasm-unsafe-eval': cubing.js biên dịch WebAssembly cho search/scramble.
 * - worker-src blob:: cubing.js có thể dựng worker từ blob URL làm phương án dự phòng.
 * - style-src 'unsafe-inline': TwistyPlayer chèn <style> trong shadow DOM.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

function contentSecurityPolicy(): Plugin {
  return {
    name: 'sobik-csp',
    apply: 'build',
    transformIndexHtml: (html) =>
      html.replace(
        '<meta charset="UTF-8">',
        `<meta charset="UTF-8">\n    <meta http-equiv="Content-Security-Policy" content="${CSP}">`,
      ),
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), contentSecurityPolicy()],
  server: {
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/catalog-source/**'] },
  },
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    // cubing.js nạp search worker như một chunk thường. Nếu helper preload của Vite
    // nằm trong chunk entry, worker sẽ import cả app (dùng `document`) và scramble lỗi
    // trên production. Tách helper ra chunk riêng và không preload phụ thuộc cho worker.
    modulePreload: {
      polyfill: false,
      resolveDependencies: (_file, deps, { hostId }) => (hostId.includes('search-worker') ? [] : deps),
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('vite/preload-helper') ? 'preload-helper' : undefined),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    testTimeout: 60_000,
  },
});
