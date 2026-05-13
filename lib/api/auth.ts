import 'server-only';
import { checkBearerAuth } from '@/lib/api-auth';
import { jsonServerError, jsonUnauthorized } from '@/lib/api/responses';

// Gate de auth service-to-service para los endpoints públicos del Seller App.
// Una sola API key shared para todos los consumers (Buyer, Payments, Shipping)
// — alineado con el mock de Shipping (lib/shipping/client.ts).
// Si la env var no está, devolvemos 500 para evitar fail-open por config.
//
// Uso en cada handler:
//   const authErr = requireBearerAuth(request);
//   if (authErr) return authErr;
export function requireBearerAuth(request: Request): Response | null {
  const expected = process.env.SELLER_INTERNAL_API_KEY;
  if (!expected) return jsonServerError('Server misconfiguration');
  if (!checkBearerAuth(request, expected)) return jsonUnauthorized();
  return null;
}
