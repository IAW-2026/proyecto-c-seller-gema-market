import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    // globalSetup: corre UNA SOLA VEZ en main process (env override, db push,
    // seed). setupFiles: corre en cada worker — solo validaciones defensivas.
    globalSetup: ['tests/global-setup.ts'],
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    // Un único worker secuencial. El seed corre contra el schema de test y
    // los tests mutating se resetean entre cada uno — paralelizar archivos
    // generaría carreras sobre el mismo Postgres.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // En runtime, Next alias-ea `server-only` a un no-op del lado server. En
      // Vitest no hay bundler de Next, así que lo redirigimos a un módulo
      // vacío local para que los imports server-side (lib/db, lib/env, etc.)
      // no exploten al cargar.
      'server-only': path.resolve(__dirname, 'tests/helpers/server-only-stub.ts'),
      // `next/cache` exige el runtime de Next (cacheComponents config) para que
      // cacheTag/updateTag no tiren. En tests las stubeamos a no-ops — no hay
      // cache real que invalidar.
      'next/cache': path.resolve(__dirname, 'tests/helpers/next-cache-stub.ts'),
    },
  },
});
