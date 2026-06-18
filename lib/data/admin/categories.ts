import 'server-only';
import { prisma } from '@/lib/db';
import { newId, PREFIXES } from '@/lib/ids';
import type { Category } from '@/types/domain';

// CRUD de categorías para el panel admin. La lectura pública vive en
// `lib/data/categories.ts`; acá viven las mutaciones que solo el admin ejecuta.

export type CategoryWithCount = Category & { productsCount: number };

export async function listCategoriesWithCounts(): Promise<
  ReadonlyArray<CategoryWithCount>
> {
  const rows = await prisma.categoria.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      _count: { select: { products: { where: { deletedAt: null } } } },
    },
  });
  return rows.map((r) => ({ id: r.id, name: r.name, productsCount: r._count.products }));
}

// Lookup por id — lo usa la API admin para devolver 404 antes de mutar.
export async function findCategory(id: string): Promise<Category | null> {
  return prisma.categoria.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
}

// Detecta nombre duplicado (case-insensitive) — lo usa la API admin para
// devolver 409 al crear/renombrar. `exceptId` excluye la propia categoría en un
// rename. `Categoria.name` no tiene constraint `@unique` en el schema, así que
// la unicidad se valida acá a nivel app.
export async function categoryNameExists(
  name: string,
  exceptId?: string,
): Promise<boolean> {
  const found = await prisma.categoria.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      id: exceptId ? { not: exceptId } : undefined,
    },
    select: { id: true },
  });
  return found !== null;
}

export async function createCategory(name: string): Promise<Category> {
  return prisma.categoria.create({
    data: { id: newId(PREFIXES.categoria), name },
    select: { id: true, name: true },
  });
}

export async function updateCategory(id: string, name: string): Promise<void> {
  const result = await prisma.categoria.updateMany({ where: { id }, data: { name } });
  if (result.count === 0) throw new Error('Categoría no encontrada.');
}

export type DeleteCategoryResult =
  | { outcome: 'deleted' }
  | { outcome: 'in_use'; productsCount: number };

// Borra una categoría solo si no tiene productos asociados (incl. soft-deleted:
// la FK `Product.categoryId` los referencia igual). Si está en uso, devuelve
// `in_use` para que la UI muestre un error claro en vez de reventar por la FK.
export async function deleteCategory(id: string): Promise<DeleteCategoryResult> {
  const productsCount = await prisma.product.count({ where: { categoryId: id } });
  if (productsCount > 0) return { outcome: 'in_use', productsCount };
  await prisma.categoria.deleteMany({ where: { id } });
  return { outcome: 'deleted' };
}
