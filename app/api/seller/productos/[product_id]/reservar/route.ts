import { z } from 'zod';
import { requireBearerAuth } from '@/lib/api/auth';
import {
  jsonConflict,
  jsonNotFound,
  jsonOk,
} from '@/lib/api/responses';
import { parseBody } from '@/lib/api/validation';
import { createReserva } from '@/lib/data/reservations';
import type { ReservarResponse } from '@/lib/api/contracts/reservations';

const BodySchema = z.object({
  order_id: z.string().min(1),
  buyer_id: z.string().min(1),
  buyer_name: z.string().min(1),
  quantity: z.number().int().min(1),
});

// POST /api/seller/productos/:product_id/reservar
// Consumido por Payments App: reserva stock al iniciar el checkout.
// Atómico: si dos requests compiten por el último unit, solo uno obtiene 201.
export async function POST(
  request: Request,
  segment: { params: Promise<{ product_id: string }> },
): Promise<Response> {
  const authErr = requireBearerAuth(request);
  if (authErr) return authErr;

  const { product_id } = await segment.params;
  if (!product_id) return jsonNotFound();

  const parsed = await parseBody(request, BodySchema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;

  const result = await createReserva({
    productId: product_id,
    orderId: body.order_id,
    buyerId: body.buyer_id,
    buyerName: body.buyer_name,
    quantity: body.quantity,
  });

  switch (result.outcome) {
    case 'created': {
      const response: ReservarResponse = { ok: true };
      return jsonOk(response);
    }
    case 'product_not_found':
      return jsonNotFound();
    case 'insufficient_stock':
      return jsonConflict('Insufficient stock');
    case 'order_already_reserved':
      return jsonConflict('Order already reserved');
    case 'order_already_sold':
      return jsonConflict('Order already sold');
    default:
      // Switch exhaustivo — si falta una rama, esto rompe en compile time.
      return ((_x: never) => jsonOk({ ok: true }))(result);
  }
}
