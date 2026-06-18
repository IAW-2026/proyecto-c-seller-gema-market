import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';

// Comparación de tokens en tiempo constante. timingSafeEqual exige misma
// longitud; chequearla primero es seguro: longitudes distintas garantizan
// no-match.
function constantTimeEqual(received: string, expected: string): boolean {
  const receivedBuf = Buffer.from(received);
  const expectedBuf = Buffer.from(expected);
  if (receivedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(receivedBuf, expectedBuf);
}

// SHA-256 hex (MAYÚSCULAS) de la API key. Las webapps con las que se integra el
// Seller App mandan el digest en hex uppercase, así que tanto las llamadas
// salientes (lib/shipping/client.ts) como la validación entrante usan este mismo
// hashing. Ojo: digest('hex') devuelve lowercase, por eso el toUpperCase().
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex').toUpperCase();
}

// Valida `X-API-Key-Hash: <sha256(key)>` contra el hash de `expected` (la key
// cruda de env). Esquema service-to-service usado por las webapps con las que se
// integra el Seller App (Buyer, Payments, Shipping). Devuelve false si el header
// falta o no matchea.
export function checkApiKeyAuth(request: Request, expected: string): boolean {
  const received = request.headers.get('x-api-key-hash');
  if (!received) return false;
  return constantTimeEqual(received, hashApiKey(expected));
}

// Valida `Authorization: Bearer <token>` contra `expected`. Lo usa solo el gate
// de Cron (requireCronAuth), porque Vercel Cron envía este header de forma fija.
// Devuelve false si el header falta, el scheme no es Bearer, o no matchea.
export function checkBearerAuth(request: Request, expected: string): boolean {
  const header = request.headers.get('authorization');
  if (!header) return false;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return false;
  return constantTimeEqual(token, expected);
}
