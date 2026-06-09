import 'server-only';
import { timingSafeEqual } from 'node:crypto';

// Comparación de tokens en tiempo constante. timingSafeEqual exige misma
// longitud; chequearla primero es seguro: longitudes distintas garantizan
// no-match.
function constantTimeEqual(received: string, expected: string): boolean {
  const receivedBuf = Buffer.from(received);
  const expectedBuf = Buffer.from(expected);
  if (receivedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(receivedBuf, expectedBuf);
}

// Valida `X-API-Key: <key>` contra `expected`. Esquema service-to-service usado
// por las webapps con las que se integra el Seller App (Buyer, Payments,
// Shipping). Devuelve false si el header falta o no matchea.
export function checkApiKeyAuth(request: Request, expected: string): boolean {
  const key = request.headers.get('x-api-key');
  if (!key) return false;
  return constantTimeEqual(key, expected);
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
