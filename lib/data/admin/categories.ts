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
