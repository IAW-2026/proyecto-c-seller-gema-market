import { requireApiKeyAuth } from '@/lib/api/auth';
import { jsonOk } from '@/lib/api/responses';
import { getCategories } from '@/lib/data/categories';
import { toCategoryItem } from '@/lib/api/mappers/categories';

// GET /api/seller/categorias — listado plano de categorías.
export async function GET(request: Request): Promise<Response> {
  const authErr = requireApiKeyAuth(request);
  if (authErr) return authErr;

  const categories = await getCategories();
  return jsonOk(categories.map(toCategoryItem));
}
