import 'server-only';
import { timingSafeEqual } from 'node:crypto';

// Valida `Authorization: Bearer <token>` comparando contra `expected` en
// tiempo constante. Devuelve false si el header falta, el scheme no es Bearer,
// o el token no matchea. timingSafeEqual exige misma longitud; chequearla
// primero es seguro: longitudes distintas garantizan no-match.
export function checkBearerAuth(request: Request, expected: string): boolean {
  const header = request.headers.get('authorization');
  if (!header) return false;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return false;

  const received = Buffer.from(token);
  const expectedBuf = Buffer.from(expected);
  if (received.length !== expectedBuf.length) return false;
  return timingSafeEqual(received, expectedBuf);
}
