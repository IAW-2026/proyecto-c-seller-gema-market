// Setup global de Vitest. Corre una sola vez por `vitest run` (con
// singleFork: true en vitest.config.ts). Responsabilidades:
//
//   1. Cargar .env y forzar DATABASE_URL = DATABASE_URL_TEST antes de que
//      cualquier import lea el env. Esto previene que el test toque la DB de
//      dev por accidente.
//   2. Validar que el URL de test apunte a un schema dedicado (`?schema=...`)
//      distinto de `public`, para defensa adicional contra borrar dev data.
//   3. Asegurar el schema en Postgres (CREATE SCHEMA IF NOT EXISTS).
//   4. Aplicar el modelo a ese schema con `prisma db push` (idempotente).
//   5. Correr el seed determinístico de tests.
//
// El import dinámico de `lib/db` y del seed sucede DESPUÉS de fijar el env,
// para que el Prisma Client se cree apuntando al schema de test.

import 'dotenv/config';
import { execSync } from 'node:child_process';
import { Client } from 'pg';
import { beforeAll } from 'vitest';

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
const testSchema = parsedSchema;

// Override antes de cualquier import de @/lib/db. tsx/Vitest hoistean imports
// estáticos pero los imports DINÁMICOS dentro de beforeAll respetan este orden.
process.env.DATABASE_URL = testUrl;
process.env.SELLER_INTERNAL_API_KEY ??= 'test-internal-key';
process.env.RESERVATION_TTL_MINUTES ??= '30';

let initialized = false;

beforeAll(async () => {
  if (initialized) return;
  initialized = true;

  // 1. Crear schema si no existe. Prisma db push no siempre lo crea según la
  // versión; este `CREATE SCHEMA` lo garantiza.
  const client = new Client({ connectionString: testUrl });
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${testSchema}"`);
  } finally {
    await client.end();
  }

  // 2. Aplicar el modelo (idempotente). Pasamos `--url` explícito porque
  // prisma.config.ts levanta DIRECT_URL (no DATABASE_URL) — sin esto, db push
  // iría contra la DB de dev aunque hayamos overrideado DATABASE_URL arriba.
  execSync(`npx prisma db push --accept-data-loss --url="${testUrl}"`, {
    stdio: 'inherit',
    env: process.env,
  });

  // 3. Importar el seed DESPUÉS del override de env (el seed importa prisma
  // internamente — necesita que el cliente lea la DATABASE_URL_TEST ya seteada).
  const { runTestSeed } = await import('./fixtures/seed');
  await runTestSeed();
});
