import { requireBearerAuth } from '@/lib/api/auth';
import { jsonOk } from '@/lib/api/responses';
import { getCategories } from '@/lib/data/categories';

// GET /api/seller/categorias
// Lista plana de categorías. Reusa getCategories() (cacheada con tag
// "categories"). El mapeo a snake_case (category_id) es el shape del contrato.
export async function GET(request: Request): Promise<Response> {
  const authErr = requireBearerAuth(request);
  if (authErr) return authErr;

  const categories = await getCategories();
  return jsonOk(
    categories.map((c) => ({ category_id: c.id, name: c.name })),
  );
}
