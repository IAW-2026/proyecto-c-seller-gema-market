import { z } from 'zod';
import { requireBearerAuth } from '@/lib/api/auth';
import {
  jsonNotFound,
  jsonOk,
} from '@/lib/api/responses';
import { parseBody } from '@/lib/api/validation';
import { releaseReserva } from '@/lib/data/reservations';
import type { LiberarReservaResponse } from '@/lib/api/contracts/reservations';

const BodySchema = z.object({
  order_id: z.string().min(1),
});

// POST /api/seller/productos/:product_id/liberar-reserva
// Consumido por Payments App cuando el comprador abandona el checkout o el
// pago falla. Borra la Reserva y restaura el stock al producto. El `product_id`
// del path tiene que matchear `Reserva.productId` (defensa contra requests
// mal armados) — si no matchea, 404.
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

  const result = await releaseReserva(parsed.data.order_id, product_id);

  switch (result.outcome) {
    case 'released': {
      const response: LiberarReservaResponse = { ok: true };
      return jsonOk(response);
    }
    case 'not_found':
      return jsonNotFound();
    default:
      return ((_x: never) => jsonOk({ ok: true }))(result);
  }
}
