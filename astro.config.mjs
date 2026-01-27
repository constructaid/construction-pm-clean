// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import solidJs from '@astrojs/solid-js';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      // Externalize native Node.js modules that shouldn't be bundled
      external: ['canvas', 'pg', 'pg-native', 'bcryptjs', 'jsonwebtoken'],
      noExternal: []
    },
    build: {
      rollupOptions: {
        external: ['pg', 'pg-native', 'canvas', 'bcryptjs', 'jsonwebtoken']
      }
    }
  },

  integrations: [solidJs()]
});