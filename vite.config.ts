import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { buildContent } from './scripts/build-content.mjs';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: '/sudo-hire-me/',
  plugins: [
    react(),
    {
      name: 'lesson-content',
      async buildStart() {
        await buildContent();
      },
      configureServer(server) {
        server.watcher.add(fileURLToPath(new URL('./content/lessons', import.meta.url)));
        let pending: ReturnType<typeof setTimeout>;
        server.watcher.on('all', (event, file) => {
          if (
            !['add', 'change', 'unlink'].includes(event) ||
            !file.replaceAll('\\', '/').includes('/content/lessons/')
          )
            return;
          clearTimeout(pending);
          pending = setTimeout(async () => {
            try {
              await buildContent();
              server.ws.send({ type: 'full-reload' });
            } catch (error) {
              server.ws.send({
                type: 'error',
                err: { message: (error as Error).message, stack: (error as Error).stack ?? '' },
              });
            }
          }, 100);
        });
        server.httpServer?.once('close', () => clearTimeout(pending));
      },
    },
  ],
  worker: { format: 'es' },
});
