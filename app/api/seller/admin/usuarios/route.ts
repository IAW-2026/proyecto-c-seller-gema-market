import { z } from 'zod';
import { requireApiKeyAuth } from '@/lib/api/auth';
import { jsonOk } from '@/lib/api/responses';
import { parseSearchParams } from '@/lib/api/validation';
import { listAdminUsuarios } from '@/lib/data/admin/usuarios';
import { toAdminUsuarioListResponse } from '@/lib/api/mappers/admin/usuarios';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /api/seller/admin/usuarios — caché local de usuarios de Clerk (tabla
// Seller). Consumido por Control Plane (vista consolidada de usuarios).
export async function GET(request: Request): Promise<Response> {
  const authErr = requireApiKeyAuth(request);
  if (authErr) return authErr;

  const parsed = parseSearchParams(request.url, QuerySchema);
  if ('error' in parsed) return parsed.error;
  const q = parsed.data;

  const page = await listAdminUsuarios({ page: q.page, pageSize: q.page_size });
  return jsonOk(toAdminUsuarioListResponse(page));
}
