"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/role";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/data/admin/categories";
import { hasErrors, validateCategoryInput } from "@/lib/validation/category";

export type CategoryActionResult = { ok: true } | { ok: false; error: string };

export async function createCategoryAction(
  name: string,
): Promise<CategoryActionResult> {
  await requireAdmin();
  const errors = validateCategoryInput({ name });
  if (hasErrors(errors)) return { ok: false, error: errors.name! };
  await createCategory(name.trim());
  updateTag("categories");
  return { ok: true };
}

export async function updateCategoryAction(
  id: string,
  name: string,
): Promise<CategoryActionResult> {
  await requireAdmin();
  const errors = validateCategoryInput({ name });
  if (hasErrors(errors)) return { ok: false, error: errors.name! };
  await updateCategory(id, name.trim());
  updateTag("categories");
  return { ok: true };
}

export async function deleteCategoryAction(
  id: string,
): Promise<CategoryActionResult> {
  await requireAdmin();
  const result = await deleteCategory(id);
  if (result.outcome === "in_use") {
    return {
      ok: false,
      error: `No se puede borrar: la categoría tiene ${result.productsCount} producto(s) asociado(s).`,
    };
  }
  updateTag("categories");
  return { ok: true };
}
