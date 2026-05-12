import 'server-only';

// Vars específicas de Supabase Storage. Se mantienen fuera de `lib/env.ts`
// para que el resto de la app pueda arrancar aunque Storage no esté
// configurado todavía (mismo criterio que el comentario en `lib/env.ts`).
//
// `SUPABASE_SECRET_KEY` usa el nuevo formato `sb_secret_xxx`. Las legacy
// `service_role` (JWTs `eyJ...`) siguen funcionando hasta fin de 2026 pero
// están deprecadas; este proyecto apunta a las nuevas desde el día 1.

function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

export const storageEnv = {
  SUPABASE_URL: required('NEXT_PUBLIC_SUPABASE_URL'),
  SUPABASE_SECRET_KEY: required('SUPABASE_SECRET_KEY'),
} as const;
