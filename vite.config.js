import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: process.env.BASE_URL || '/',
  plugins: [svelte()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        map: fileURLToPath(new URL('./map/index.html', import.meta.url)),
      },
    },
  },
});
