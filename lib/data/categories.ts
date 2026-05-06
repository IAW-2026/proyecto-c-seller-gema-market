import 'server-only';
import { prisma } from '@/lib/db';
import type { Category } from '@/types/domain';

export async function getCategories(): Promise<ReadonlyArray<Category>> {
  return prisma.categoria.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
}
