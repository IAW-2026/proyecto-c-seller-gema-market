import { z } from 'zod';
import { requireApiKeyAuth } from '@/lib/api/auth';
import {
  jsonBadRequest,
  jsonNotFound,
  jsonOk,
} from '@/lib/api/responses';
import { parseBody } from '@/lib/api/validation';
import { updateSaleShipping } from '@/lib/data/sales';
import type {
  EstadoEnvioResponse,
  ShippingExternalStatus,
} from '@/lib/api/contracts/sales';
import type { OrderStatus } from '@/types/domain';

// Traducción del vocabulario externo (Shipping App) al enum interno SaleStatus.
// Single source of truth para esta translation table. Si Shipping App incorpora
// nuevos estados en el futuro, se extiende acá + el `z.enum` del schema.
const SHIPPING_TO_SALE_STATUS: Record<ShippingExternalStatus, OrderStatus> = {
  in_transit: 'shipping',
  delivered: 'delivered',
  failed: 'shipping_failed',
};

const BodySchema = z.object({
  order_id: z.string().min(1),
  status: z.enum(['in_transit', 'delivered', 'failed']),
  tracking_code: z.string().min(1),
  updated_at: z.string().min(1),
});

// POST /api/seller/ventas/:order_id/estado-envio
// Consumido por Shipping App al cambiar el estado del envío. Actualiza la Sale
// y persiste el tracking_code. No valida transiciones de estado: Shipping App
// es la autoridad sobre la realidad del envío.
export async function POST(
  request: Request,
  segment: { params: Promise<{ order_id: string }> },
): Promise<Response> {
  const authErr = requireApiKeyAuth(request);
  if (authErr) return authErr;

  const { order_id } = await segment.params;
  if (!order_id) return jsonNotFound();

  const parsed = await parseBody(request, BodySchema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;

  // order_id del path tiene que matchear el del body.
  if (body.order_id !== order_id) {
    return jsonBadRequest('order_id mismatch');
  }

  const result = await updateSaleShipping({
    orderId: order_id,
    status: SHIPPING_TO_SALE_STATUS[body.status],
    trackingCode: body.tracking_code,
  });

  switch (result.outcome) {
    case 'updated': {
      const response: EstadoEnvioResponse = { ok: true };
      return jsonOk(response);
    }
    case 'not_found':
      return jsonNotFound();
    default:
      return ((_x: never) => jsonOk({ ok: true }))(result);
  }
}
