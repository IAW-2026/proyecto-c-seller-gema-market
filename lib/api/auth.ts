import 'server-only';
import { checkApiKeyAuth, checkBearerAuth } from '@/lib/api-auth';
import { jsonServerError, jsonUnauthorized } from '@/lib/api/responses';

// Gate de auth service-to-service para los endpoints públicos del Seller App.
// Valida el header `X-API-Key-Hash` (SHA-256 de la key). Una sola API key shared para todos los consumers
// (Buyer, Payments, Shipping) — alineado con el mock de Shipping
// (lib/shipping/client.ts).
// Si la env var no está, devolvemos 500 para evitar fail-open por config.
//
// Uso en cada handler:
//   const authErr = requireApiKeyAuth(request);
//   if (authErr) return authErr;
export function requireApiKeyAuth(request: Request): Response | null {
  const expected = process.env.SELLER_INTERNAL_API_KEY;
  if (!expected) return jsonServerError('Server misconfiguration');
  if (!checkApiKeyAuth(request, expected)) return jsonUnauthorized();
  return null;
}

// Gate de auth para endpoints internos disparados por Vercel Cron. Vercel
// envía `Authorization: Bearer ${CRON_SECRET}` automáticamente cuando el cron
// está configurado en `vercel.json` y la env var está seteada en el proyecto.
//
// Mantiene la key separada de SELLER_INTERNAL_API_KEY para que un compromiso
// de la key shared con Buyer/Payments/Shipping no exponga los endpoints
// administrativos internos.
export function requireCronAuth(request: Request): Response | null {
  const expected = process.env.CRON_SECRET;
  if (!expected) return jsonServerError('Server misconfiguration');
  if (!checkBearerAuth(request, expected)) return jsonUnauthorized();
  return null;
}
