import 'server-only';

function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

// Extender aquí cuando se agreguen CLERK_SECRET_KEY, EXTERNAL_API_KEY, etc.
export const env = {
  DATABASE_URL: required("DATABASE_URL"),
} as const;
