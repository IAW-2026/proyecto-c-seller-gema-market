import { z } from 'zod';
import { requireBearerAuth } from '@/lib/api/auth';
import { jsonOk } from '@/lib/api/responses';
import { parseSearchParams } from '@/lib/api/validation';
import { listPublicProducts } from '@/lib/data/public-products';
import { toProductListResponse } from '@/lib/api/mappers/products';

// Coerce: los query params vienen como strings; números/enums se castean.
const QuerySchema = z.object({
  q: z.string().optional(),
  category_id: z.string().optional(),
  seller_id: z.string().optional(),
  condition: z.enum(['nuevo', 'usado', 'all']).default('all'),
  min_price: z.coerce.number().nonnegative().optional(),
  max_price: z.coerce.number().nonnegative().optional(),
  sort_by: z.enum(['price', 'created_at', 'title']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /api/seller/productos — listado paginado del catálogo público.
export async function GET(request: Request): Promise<Response> {
  const authErr = requireBearerAuth(request);
  if (authErr) return authErr;

  const parsed = parseSearchParams(request.url, QuerySchema);
  if ('error' in parsed) return parsed.error;
  const q = parsed.data;

  const page = await listPublicProducts({
    q: q.q,
    categoryId: q.category_id,
    sellerId: q.seller_id,
    condition: q.condition,
    minPrice: q.min_price,
    maxPrice: q.max_price,
    sortBy: q.sort_by,
    order: q.order,
    page: q.page,
    pageSize: q.page_size,
  });

  const origin = new URL(request.url).origin;
  return jsonOk(toProductListResponse(page, origin));
}
