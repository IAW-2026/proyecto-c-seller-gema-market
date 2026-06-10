import { z } from 'zod';
import { requireApiKeyAuth } from '@/lib/api/auth';
import { jsonConflict, jsonCreated, jsonOk } from '@/lib/api/responses';
import { parseBody } from '@/lib/api/validation';
import {
  categoryNameExists,
  createCategory,
  listCategoriesWithCounts,
} from '@/lib/data/admin/categories';
import {
  toAdminCategoryItem,
  toAdminCategoryMutationResponse,
} from '@/lib/api/mappers/admin/categories';

// GET /api/seller/admin/categorias — listado con conteo de productos.
export async function GET(request: Request): Promise<Response> {
  const authErr = requireApiKeyAuth(request);
  if (authErr) return authErr;

  const categories = await listCategoriesWithCounts();
  return jsonOk(categories.map(toAdminCategoryItem));
}

const BodySchema = z.object({
  name: z.string().trim().min(1).max(60),
});

// POST /api/seller/admin/categorias — crea una categoría. 409 si el nombre ya
// existe (case-insensitive). Consumido por Control Plane.
export async function POST(request: Request): Promise<Response> {
  const authErr = requireApiKeyAuth(request);
  if (authErr) return authErr;

  const parsed = await parseBody(request, BodySchema);
  if ('error' in parsed) return parsed.error;
  const { name } = parsed.data;

  if (await categoryNameExists(name)) {
    return jsonConflict('Ya existe una categoría con ese nombre');
  }

  const category = await createCategory(name);
  return jsonCreated(toAdminCategoryMutationResponse(category));
}
