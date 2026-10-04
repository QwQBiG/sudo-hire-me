import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { buildDocs } from './scripts/build-docs.mjs';

export default defineConfig({
  base: '/sudo-hire-me/',
  plugins: [
    react(),
    {
      name: 'free-documents',
      async buildStart() {
        await buildDocs();
      },
    },
  ],
});
