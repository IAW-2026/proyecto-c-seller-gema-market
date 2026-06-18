import { z } from 'zod';
import { requireApiKeyAuth } from '@/lib/api/auth';
import { jsonOk } from '@/lib/api/responses';
import { parseSearchParams } from '@/lib/api/validation';
import { listAdminSellers } from '@/lib/data/admin/sellers';
import { toAdminSellerListResponse } from '@/lib/api/mappers/admin/sellers';

const QuerySchema = z.object({
  q: z.string().optional(),
  suspended: z.enum(['true', 'false']).optional(),
  sort_by: z.enum(['created_at', 'shop_name']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /api/seller/admin/sellers — listado de sellers. Consumido por Control Plane.
export async function GET(request: Request): Promise<Response> {
  const authErr = requireApiKeyAuth(request);
  if (authErr) return authErr;

  const parsed = parseSearchParams(request.url, QuerySchema);
  if ('error' in parsed) return parsed.error;
  const q = parsed.data;

  const page = await listAdminSellers({
    query: q.q,
    suspended: q.suspended === undefined ? undefined : q.suspended === 'true',
    sortBy: q.sort_by,
    order: q.order,
    page: q.page,
    pageSize: q.page_size,
  });

  return jsonOk(toAdminSellerListResponse(page));
}
