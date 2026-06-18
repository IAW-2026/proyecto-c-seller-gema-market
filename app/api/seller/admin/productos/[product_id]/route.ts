import { z } from 'zod';
import { requireApiKeyAuth } from '@/lib/api/auth';
import { jsonNotFound, jsonOk } from '@/lib/api/responses';
import { parseBody } from '@/lib/api/validation';
import {
  getAdminProductDetail,
  setProductModeration,
} from '@/lib/data/admin/products';
import {
  toAdminProductDetailResponse,
} from '@/lib/api/mappers/admin/products';
import type { AdminProductModerationResponse } from '@/lib/api/contracts/admin/products';

// GET /api/seller/admin/productos/:product_id — detalle admin.
// A diferencia del público, devuelve status, hidden_by_admin, deleted_at, stock.
export async function GET(
  request: Request,
  segment: { params: Promise<{ product_id: string }> },
): Promise<Response> {
  const authErr = requireApiKeyAuth(request);
  if (authErr) return authErr;

  const { product_id } = await segment.params;
  if (!product_id) return jsonNotFound();

  const product = await getAdminProductDetail(product_id);
  if (!product) return jsonNotFound();

  return jsonOk(toAdminProductDetailResponse(product));
}

const BodySchema = z
  .object({
    hidden_by_admin: z.boolean().optional(),
    status: z.enum(['active', 'paused']).optional(),
  })
  .refine(
    (b) => b.hidden_by_admin !== undefined || b.status !== undefined,
    { error: 'Nada para actualizar' },
  );

// PATCH /api/seller/admin/productos/:product_id — moderación. Consumido por
// Control Plane. Con hidden_by_admin=true o status="paused" el producto
// desaparece del catálogo público.
export async function PATCH(
  request: Request,
  segment: { params: Promise<{ product_id: string }> },
): Promise<Response> {
  const authErr = requireApiKeyAuth(request);
  if (authErr) return authErr;

  const { product_id } = await segment.params;
  if (!product_id) return jsonNotFound();

  const parsed = await parseBody(request, BodySchema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;

  const result = await setProductModeration(product_id, {
    hiddenByAdmin: body.hidden_by_admin,
    status: body.status,
  });
  if (!result) return jsonNotFound();

  const response: AdminProductModerationResponse = {
    product_id: result.id,
    status: result.status,
    hidden_by_admin: result.hiddenByAdmin,
  };
  return jsonOk(response);
}
