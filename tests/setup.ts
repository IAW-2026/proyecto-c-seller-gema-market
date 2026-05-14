// setupFiles: corre en cada worker de tests, después de que globalSetup ya
// preparó la DB y seteó las env vars en el proceso padre (los workers heredan
// process.env al forkearse).
//
// Acá solo validamos defensivamente que el env vino con los valores correctos.
// Toda la lógica pesada (CREATE SCHEMA, db push, seed) vive en
// tests/global-setup.ts y corre UNA SOLA VEZ por `npm test`.

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL no está seteada en el worker. ¿globalSetup corrió bien?',
  );
}
if (!process.env.SELLER_INTERNAL_API_KEY) {
  throw new Error('SELLER_INTERNAL_API_KEY no está seteada en el worker.');
}
