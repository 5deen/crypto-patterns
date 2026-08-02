import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // GitHub Pages serves this project repo from a subpath
  // (https://5deen.github.io/crypto-patterns/), so every absolute asset URL in
  // index.html and in main.css has to be prefixed with it. Vite rewrites them
  // at build time from this value. It applies to the dev server and `preview`
  // too, so all three environments agree on the same paths — rename the repo
  // and this is the one line to change.
  base: '/crypto-patterns/',
  plugins: [tailwindcss()],

  // Multi-page build. Vite only picks up index.html on its own, so every other
  // entry HTML has to be listed here or it is silently left out of dist/.
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        privacy: resolve(import.meta.dirname, 'privacy.html'),
        contact: resolve(import.meta.dirname, 'contact.html'),
      },
    },
  },
});
