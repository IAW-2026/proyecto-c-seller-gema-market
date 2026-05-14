import { z } from 'zod';
import { requireBearerAuth } from '@/lib/api/auth';
import { jsonNotFound, jsonOk } from '@/lib/api/responses';
import { parseSearchParams } from '@/lib/api/validation';
import { findPublicShop } from '@/lib/data/public-shop';
import { toShopResponse } from '@/lib/api/mappers/shops';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /api/seller/shops/:seller_id
// Tienda pública: seller info + categorías que usa + productos paginados.
// 404 si el seller no existe. Las categorías son distinct sobre los productos
// activos del seller (no incluye categorías sin productos visibles).
export async function GET(
  request: Request,
  segment: { params: Promise<{ seller_id: string }> },
): Promise<Response> {
  const authErr = requireBearerAuth(request);
  if (authErr) return authErr;

  const { seller_id } = await segment.params;
  if (!seller_id) return jsonNotFound();

  const parsedQuery = parseSearchParams(request.url, QuerySchema);
  if ('error' in parsedQuery) return parsedQuery.error;

  const shop = await findPublicShop(seller_id, {
    page: parsedQuery.data.page,
    pageSize: parsedQuery.data.page_size,
  });
  if (!shop) return jsonNotFound();

  const origin = new URL(request.url).origin;
  return jsonOk(toShopResponse(shop, origin));
}
