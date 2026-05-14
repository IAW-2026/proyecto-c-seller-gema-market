import { requireBearerAuth } from '@/lib/api/auth';
import { jsonNotFound, jsonOk } from '@/lib/api/responses';
import { findPublicProduct } from '@/lib/data/public-products';
import { toProductDetailResponse } from '@/lib/api/mappers/products';

// GET /api/seller/productos/:product_id — detalle público del producto.
export async function GET(
  request: Request,
  segment: { params: Promise<{ product_id: string }> },
): Promise<Response> {
  const authErr = requireBearerAuth(request);
  if (authErr) return authErr;

  const { product_id } = await segment.params;
  if (!product_id) return jsonNotFound();

  const product = await findPublicProduct(product_id);
  if (!product) return jsonNotFound();

  return jsonOk(toProductDetailResponse(product));
}
