import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // `server-only` throws outside a React Server bundle; tests run the server modules directly.
      'server-only': path.resolve(__dirname, 'test/server-only.ts'),
    },
  },
  test: { environment: 'node' },
});
