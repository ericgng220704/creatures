import { defineConfig } from 'vite';

// base './' lets the built pages be served from any folder, e.g. GitHub Pages.
// Two pages: the creature sheet (index.html) and the battle preview (battle.html).
export default defineConfig({
  base: './',
  build: { rollupOptions: { input: { sheet: 'index.html', battle: 'battle.html' } } }
});
