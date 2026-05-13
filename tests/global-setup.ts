// Global setup de Vitest: corre UNA SOLA VEZ en el proceso principal, antes
// de que se spawneen los workers de tests. Los workers heredan el `process.env`
// del padre al forkearse, así que setear DATABASE_URL/etc. acá hace que cada
// worker arranque ya configurado para apuntar al schema de test.
//
// Responsabilidades:
//   1. Validar y override de env (DATABASE_URL → DATABASE_URL_TEST).
//   2. Asegurar el schema en Postgres (CREATE SCHEMA IF NOT EXISTS).
//   3. Aplicar el modelo con `prisma db push` (idempotente).
//   4. Correr el seed determinístico.
//
// Como esto corre en main, no en cada worker, evitamos repetir db push + seed
// por cada test file. La diferencia: ~14s una sola vez vs. ~14s × N files.

import 'dotenv/config';
import { execSync } from 'node:child_process';
import { Client } from 'pg';

export async function setup(): Promise<void> {
  const testUrl = process.env.DATABASE_URL_TEST;
  if (!testUrl) {
    throw new Error(
      'DATABASE_URL_TEST no está seteada. Apuntala a una DB con un schema dedicado (ej. "?schema=test").',
    );
  }

  const parsedSchema = new URL(testUrl).searchParams.get('schema');
  if (!parsedSchema || parsedSchema === 'public') {
    throw new Error(
      `DATABASE_URL_TEST debe incluir "?schema=<nombre>" con un valor distinto de "public" (recibido: "${parsedSchema ?? '<vacío>'}"). Esto aísla el schema de test del de dev.`,
    );
  }

  // Setear env ANTES de cualquier import dinámico — los workers heredan estos
  // valores al forkearse después de que termine globalSetup.
  process.env.DATABASE_URL = testUrl;
  process.env.SELLER_INTERNAL_API_KEY ??= 'test-internal-key';
  process.env.RESERVATION_TTL_MINUTES ??= '30';

  // 1. Crear schema si no existe.
  const client = new Client({ connectionString: testUrl });
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${parsedSchema}"`);
  } finally {
    await client.end();
  }

  // 2. Aplicar el modelo. `--url` explícito porque prisma.config.ts usa
  // DIRECT_URL — sin esto db push iría contra dev.
  execSync(`npx prisma db push --accept-data-loss --url="${testUrl}"`, {
    stdio: 'inherit',
    env: process.env,
  });

  // 3. Seed. Import dinámico para que ocurra DESPUÉS del override de env.
  const { runTestSeed } = await import('./fixtures/seed');
  await runTestSeed();
}

export async function teardown(): Promise<void> {
  // No-op: el schema persiste entre corridas para que `prisma db push` sea
  // idempotente y el seed solo trunque + repoble (más rápido que recrear todo).
}
