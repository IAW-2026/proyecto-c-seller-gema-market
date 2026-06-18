import 'server-only';
import { cacheTag } from 'next/cache';
import { prisma } from '@/lib/db';
import type { Category } from '@/types/domain';

export async function getCategories(): Promise<ReadonlyArray<Category>> {
  "use cache";
  cacheTag("categories");
  return prisma.categoria.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
}
