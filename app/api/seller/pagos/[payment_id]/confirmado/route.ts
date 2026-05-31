import { z } from 'zod';
import { requireBearerAuth } from '@/lib/api/auth';
import {
  jsonBadRequest,
  jsonConflict,
  jsonNotFound,
  jsonOk,
} from '@/lib/api/responses';
import { parseBody } from '@/lib/api/validation';
import { confirmPaymentSales } from '@/lib/data/sales';
import type { PagoConfirmadoResponse } from '@/lib/api/contracts/payments';

const OrderItemSchema = z.object({
  order_id: z.string().min(1),
  product_id: z.string().min(1),
  quote_id: z.string().min(1),
  amount: z.number().nonnegative(),
  fee: z.number().nonnegative(),
  currency: z.string().min(1),
  paid_at: z.string().min(1),
});

const BodySchema = z.object({
  payment_id: z.string().min(1),
  orders: z.array(OrderItemSchema).min(1),
});

// POST /api/seller/pagos/:payment_id/confirmado
// Consumido por Payments App tras aprobar el pago. Convierte cada Reserva
// previa en una Sale (buyer_id, buyer_name y quantity salen de la Reserva;
// total y fee del request). Semántica all-or-nothing: si una sola Reserva
// falta, ninguna Sale se crea — 409.
export async function POST(
  request: Request,
  segment: { params: Promise<{ payment_id: string }> },
): Promise<Response> {
  const authErr = requireBearerAuth(request);
  if (authErr) return authErr;

  const { payment_id } = await segment.params;
  if (!payment_id) return jsonNotFound();

  const parsed = await parseBody(request, BodySchema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;

  // El payment_id del body tiene que matchear el del path — defensa contra
  // requests mal armados que apuntan a un payment pero traen otro adentro.
  if (body.payment_id !== payment_id) {
    return jsonBadRequest('payment_id mismatch');
  }

  const result = await confirmPaymentSales({
    paymentId: payment_id,
    orders: body.orders.map((o) => ({
      orderId: o.order_id,
      productId: o.product_id,
      total: o.amount,
      fee: o.fee,
    })),
  });

  switch (result.outcome) {
    case 'confirmed': {
      const response: PagoConfirmadoResponse = { ok: true };
      return jsonOk(response);
    }
    case 'reserva_not_found':
      return jsonConflict(
        `No active Reserva for order_id=${result.orderId} product_id=${result.productId}`,
      );
    default:
      return ((_x: never) => jsonOk({ ok: true }))(result);
  }
}
