import { z } from 'zod';
import { requireApiKeyAuth } from '@/lib/api/auth';
import { jsonConflict, jsonNotFound, jsonOk } from '@/lib/api/responses';
import { parseBody } from '@/lib/api/validation';
import {
  deleteCategory,
  findCategory,
  updateCategory,
} from '@/lib/data/admin/categories';
import { toAdminCategoryMutationResponse } from '@/lib/api/mappers/admin/categories';
import type { AdminCategoryDeleteResponse } from '@/lib/api/contracts/admin/categories';

const BodySchema = z.object({
  name: z.string().trim().min(1).max(60),
});

// PATCH /api/seller/admin/categorias/:id — renombra una categoría. 404 si no existe.
export async function PATCH(
  request: Request,
  segment: { params: Promise<{ id: string }> },
): Promise<Response> {
  const authErr = requireApiKeyAuth(request);
  if (authErr) return authErr;

  const { id } = await segment.params;
  if (!id) return jsonNotFound();

  const parsed = await parseBody(request, BodySchema);
  if ('error' in parsed) return parsed.error;
  const { name } = parsed.data;

  const existing = await findCategory(id);
  if (!existing) return jsonNotFound();

  await updateCategory(id, name);
  return jsonOk(toAdminCategoryMutationResponse({ id, name }));
}

// DELETE /api/seller/admin/categorias/:id — borra una categoría. 404 si no
// existe, 409 si tiene productos asociados.
export async function DELETE(
  request: Request,
  segment: { params: Promise<{ id: string }> },
): Promise<Response> {
  const authErr = requireApiKeyAuth(request);
  if (authErr) return authErr;

  const { id } = await segment.params;
  if (!id) return jsonNotFound();

  const existing = await findCategory(id);
  if (!existing) return jsonNotFound();

  const result = await deleteCategory(id);
  if (result.outcome === 'in_use') {
    return jsonConflict(
      `La categoría tiene ${result.productsCount} producto(s) asociado(s)`,
    );
  }

  const response: AdminCategoryDeleteResponse = { ok: true };
  return jsonOk(response);
}
