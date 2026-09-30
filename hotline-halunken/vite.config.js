import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Demo-Build (npm run build:demo): läuft komplett im Browser, relative Pfade, ohne Server-Dateien.
function demoHtml() {
  return {
    name: 'demo-html',
    transformIndexHtml(html) {
      return html
        .split('\n')
        .filter((line) => !/manifest|apple-touch|apple-mobile|og:image|twitter:image/.test(line))
        .join('\n')
        .replace('href="/favicon.svg"', `href="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#ffd23f"/><text x="32" y="44" font-size="36" text-anchor="middle">📞</text></svg>')}"`);
    },
  };
}

export default defineConfig(({ mode }) => ({
  root: 'client',
  base: mode === 'demo' ? './' : '/',
  publicDir: mode === 'demo' ? false : 'public',
  plugins: [react(), ...(mode === 'demo' ? [demoHtml()] : [])],
  build: {
    outDir: mode === 'demo' ? '../dist-demo' : '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/socket.io': { target: 'http://localhost:3000', ws: true },
      '/config.json': 'http://localhost:3000',
    },
  },
}));
