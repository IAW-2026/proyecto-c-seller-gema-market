import 'server-only';
import { prisma } from '@/lib/db';

// Métricas consolidadas del marketplace para el dashboard del admin. Es una
// herramienta de lectura/análisis (no CRUD): totales del sistema completo.

export type AdminMetrics = {
  sellers: { total: number; suspended: number };
  products: { total: number; hidden: number };
  sales: { count: number; revenue: number };
  topCategories: ReadonlyArray<{ name: string; productsCount: number }>;
};

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const [
    sellersTotal,
    sellersSuspended,
    productsTotal,
    productsHidden,
    salesCount,
    revenueAgg,
    categoryRows,
  ] = await Promise.all([
    prisma.seller.count(),
    prisma.seller.count({ where: { suspended: true } }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null, hiddenByAdmin: true } }),
    prisma.sale.count(),
    prisma.sale.aggregate({ _sum: { total: true } }),
    prisma.categoria.findMany({
      orderBy: { products: { _count: 'desc' } },
      take: 5,
      select: {
        name: true,
        _count: { select: { products: { where: { deletedAt: null } } } },
      },
    }),
  ]);

  return {
    sellers: { total: sellersTotal, suspended: sellersSuspended },
    products: { total: productsTotal, hidden: productsHidden },
    sales: { count: salesCount, revenue: revenueAgg._sum.total?.toNumber() ?? 0 },
    topCategories: categoryRows.map((c) => ({
      name: c.name,
      productsCount: c._count.products,
    })),
  };
}
