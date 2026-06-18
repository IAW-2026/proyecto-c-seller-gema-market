// Headers de auth para invocar los handlers desde tests. La key se levanta
// del env que armó tests/setup.ts (default: 'test-internal-key') y se manda
// hasheada (SHA-256), igual que los consumers reales.
import { hashApiKey } from '@/lib/api-auth';

export function authHeader(): Record<string, string> {
  const key = process.env.SELLER_INTERNAL_API_KEY;
  if (!key) throw new Error('SELLER_INTERNAL_API_KEY no está seteada en tests');
  return { 'x-api-key-hash': hashApiKey(key) };
}
