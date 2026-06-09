import { z } from 'zod';
import { requireApiKeyAuth } from '@/lib/api/auth';
import { jsonBadRequest, jsonOk } from '@/lib/api/responses';
import { findPublicProductsByIds } from '@/lib/data/public-products';
import { toProductBatchResponse } from '@/lib/api/mappers/products';

const BodySchema = z.object({
  product_ids: z.array(z.string().min(1)).min(1),
});

// POST /api/seller/productos/batch — resuelve un lote de productos por IDs.
// IDs inexistentes / pausados / soft-deleted se omiten silenciosamente (el
// carrito sigue mostrando los demás).
export async function POST(request: Request): Promise<Response> {
  const authErr = requireApiKeyAuth(request);
  if (authErr) return authErr;

  // Validación manual para devolver el mensaje exacto del contrato. parseBody
  // genérico devolvería `Bad Request` y queremos un mensaje específico.
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonBadRequest('product_ids is required and must be a non-empty array');
  }
  const parsed = BodySchema.safeParse(payload);
  if (!parsed.success) {
    return jsonBadRequest('product_ids is required and must be a non-empty array');
  }

  const items = await findPublicProductsByIds(parsed.data.product_ids);
  return jsonOk(toProductBatchResponse(items));
}
