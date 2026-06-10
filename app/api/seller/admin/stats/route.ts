import { z } from 'zod';
import { requireApiKeyAuth } from '@/lib/api/auth';
import { jsonOk } from '@/lib/api/responses';
import { parseSearchParams } from '@/lib/api/validation';
import { getAdminStats } from '@/lib/data/admin/stats';
import { toAdminStatsResponse } from '@/lib/api/mappers/admin/stats';

const QuerySchema = z.object({
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
});

// GET /api/seller/admin/stats — métricas agregadas. Consumido por Analytics.
export async function GET(request: Request): Promise<Response> {
  const authErr = requireApiKeyAuth(request);
  if (authErr) return authErr;

  const parsed = parseSearchParams(request.url, QuerySchema);
  if ('error' in parsed) return parsed.error;
  const q = parsed.data;

  const stats = await getAdminStats({
    dateFrom: q.date_from ? new Date(q.date_from) : undefined,
    dateTo: q.date_to ? new Date(q.date_to) : undefined,
  });

  return jsonOk(toAdminStatsResponse(stats));
}
