import { z } from 'zod';
import { requireApiKeyAuth } from '@/lib/api/auth';
import { jsonOk } from '@/lib/api/responses';
import { parseSearchParams } from '@/lib/api/validation';
import { listAdminProducts } from '@/lib/data/admin/products';
import { toAdminProductListResponse } from '@/lib/api/mappers/admin/products';

const QuerySchema = z.object({
  q: z.string().optional(),
  category_id: z.string().optional(),
  seller_id: z.string().optional(),
  status: z.enum(['active', 'paused']).optional(), // sin default → muestra todos
  condition: z.enum(['nuevo', 'usado', 'all']).default('all'),
  hidden: z.enum(['true', 'false']).optional(),
  include_deleted: z.enum(['true', 'false']).default('false'),
  min_price: z.coerce.number().nonnegative().optional(),
  max_price: z.coerce.number().nonnegative().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  sort_by: z.enum(['price', 'created_at', 'title', 'stock']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /api/seller/admin/productos — listado admin (incluye paused/ocultos).
// Consumido por Control Plane y Analytics.
export async function GET(request: Request): Promise<Response> {
  const authErr = requireApiKeyAuth(request);
  if (authErr) return authErr;

  const parsed = parseSearchParams(request.url, QuerySchema);
  if ('error' in parsed) return parsed.error;
  const q = parsed.data;

  const page = await listAdminProducts({
    query: q.q,
    categoryId: q.category_id,
    sellerId: q.seller_id,
    status: q.status,
    condition: q.condition,
    hidden: q.hidden === undefined ? undefined : q.hidden === 'true',
    includeDeleted: q.include_deleted === 'true',
    minPrice: q.min_price,
    maxPrice: q.max_price,
    dateFrom: q.date_from ? new Date(q.date_from) : undefined,
    dateTo: q.date_to ? new Date(q.date_to) : undefined,
    sortBy: q.sort_by,
    order: q.order,
    page: q.page,
    pageSize: q.page_size,
  });

  return jsonOk(toAdminProductListResponse(page));
}
