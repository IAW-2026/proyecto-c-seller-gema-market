import { z } from 'zod';
import { requireApiKeyAuth } from '@/lib/api/auth';
import { jsonOk } from '@/lib/api/responses';
import { parseSearchParams } from '@/lib/api/validation';
import { listAdminSales } from '@/lib/data/admin/sales';
import { toAdminSaleListResponse } from '@/lib/api/mappers/admin/sales';

const QuerySchema = z.object({
  seller_id: z.string().optional(),
  status: z.enum(['paid', 'shipping', 'delivered', 'shipping_failed']).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  sort_by: z.enum(['created_at', 'total']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /api/seller/admin/ventas — listado de ventas.
// Consumido por Control Plane y Analytics.
export async function GET(request: Request): Promise<Response> {
  const authErr = requireApiKeyAuth(request);
  if (authErr) return authErr;

  const parsed = parseSearchParams(request.url, QuerySchema);
  if ('error' in parsed) return parsed.error;
  const q = parsed.data;

  const page = await listAdminSales({
    sellerId: q.seller_id,
    status: q.status,
    dateFrom: q.date_from ? new Date(q.date_from) : undefined,
    dateTo: q.date_to ? new Date(q.date_to) : undefined,
    sortBy: q.sort_by,
    order: q.order,
    page: q.page,
    pageSize: q.page_size,
  });

  return jsonOk(toAdminSaleListResponse(page));
}
