import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { storageEnv } from './env';

// Cliente singleton de Supabase usado SOLO en server (data layer + server
// actions). Bypassea RLS porque usa el Secret Key; nunca debe importarse
// desde código que se mande al browser.
//
// Los tres `false` son la práctica recomendada por Supabase para SSR: evitan
// que el SDK intente persistir sesión / refrescar tokens / leer la URL,
// flujos que no aplican cuando el cliente es server-only y de servicio.

export const STORAGE_BUCKET = 'gema-market';

let cached: SupabaseClient | null = null;

export function getSupabaseStorage(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(storageEnv.SUPABASE_URL, storageEnv.SUPABASE_SECRET_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cached;
}
