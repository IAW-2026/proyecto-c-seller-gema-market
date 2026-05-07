import 'server-only';

function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

// Extender aquí cuando se agreguen CLERK_SECRET_KEY, EXTERNAL_API_KEY, etc.
// Lazy getters: la validación corre cuando se accede a la variable, no al
// importar el módulo. Esto permite que el build de Next.js (page data
// collection) evalúe módulos del server sin necesitar las env vars reales.
export const env = {
  get DATABASE_URL() {
    return required("DATABASE_URL");
  },
  get DIRECT_URL() {
    return required("DIRECT_URL");
  },
} as const;
