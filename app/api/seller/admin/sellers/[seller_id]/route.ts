import { z } from 'zod';
import { requireApiKeyAuth } from '@/lib/api/auth';
import { jsonNotFound, jsonOk } from '@/lib/api/responses';
import { parseBody } from '@/lib/api/validation';
import { findSeller } from '@/lib/data/sellers';
import { setSellerSuspended } from '@/lib/data/admin/sellers';
import type { AdminSellerSuspendResponse } from '@/lib/api/contracts/admin/sellers';

const BodySchema = z.object({
  suspended: z.boolean(),
});

// PATCH /api/seller/admin/sellers/:seller_id — suspende/reactiva un seller.
// Con suspended=true sus productos salen del catálogo público.
export async function PATCH(
  request: Request,
  segment: { params: Promise<{ seller_id: string }> },
): Promise<Response> {
  const authErr = requireApiKeyAuth(request);
  if (authErr) return authErr;

  const { seller_id } = await segment.params;
  if (!seller_id) return jsonNotFound();

  const parsed = await parseBody(request, BodySchema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;

  // Pre-check de existencia para devolver un 404 limpio (setSellerSuspended
  // tira un Error genérico si no encuentra el seller).
  const seller = await findSeller(seller_id);
  if (!seller) return jsonNotFound();

  await setSellerSuspended(seller_id, body.suspended);

  const response: AdminSellerSuspendResponse = {
    seller_id,
    suspended: body.suspended,
  };
  return jsonOk(response);
}
