import { requireApiKeyAuth } from '@/lib/api/auth';
import { jsonNotFound, jsonOk } from '@/lib/api/responses';
import { findProductOriginAddress } from '@/lib/data/public-products';

// GET /api/seller/productos/:product_id/direccion-origen — dirección de origen
// (la del vendedor del producto) que la Shipping App usa como punto de partida
// para cotizar y crear el envío.
export async function GET(
  request: Request,
  segment: { params: Promise<{ product_id: string }> },
): Promise<Response> {
  const authErr = requireApiKeyAuth(request);
  if (authErr) return authErr;

  const { product_id } = await segment.params;
  if (!product_id) return jsonNotFound();

  const origin = await findProductOriginAddress(product_id);
  if (!origin) return jsonNotFound();

  return jsonOk({ origin_address: origin });
}
