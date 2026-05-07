import 'server-only';

function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

// Solo variables que la app necesita en CADA request. Las que solo se usan en
// rutas específicas (p.ej. CLERK_WEBHOOK_SECRET en el webhook) se validan en
// su propio módulo: así una variable faltante de una feature no rompe el
// resto. Las que lee un SDK directamente (CLERK_SECRET_KEY,
// NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) NO se declaran acá — el SDK ya falla
// con su propio mensaje.
export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  DIRECT_URL: required("DIRECT_URL"),
} as const;
