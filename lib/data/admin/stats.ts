import 'server-only';
import { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/db';

// Métricas agregadas para el Analytics Dashboard (API admin server-to-server).
//
// Decisión de alcance del rango temporal (`dateFrom`/`dateTo`): el rango scopea
// SOLO las métricas de ventas (total_sales, total_revenue, top_sellers por
// revenue). Los conteos de productos (total_products, products_by_status,
// hidden_products) y top_categories reflejan el estado actual del catálogo —
// son inventario point-in-time, no una serie temporal. Documentado en
// docs/apis.md.
//
// `total_products` y `products_by_status` excluyen soft-deleted. `total_revenue`
// = sum(Sale.total) en el rango. `top_*` limitados a 5, ordenados desc.

export type AdminStats = {
  totalProducts: number;
  productsByStatus: { active: number; paused: number };
  hiddenProducts: number;
  totalSales: number;
  totalRevenue: number;
  currency: string;
  topCategories: ReadonlyArray<{ categoryId: string; name: string; count: number }>;
  topSellers: ReadonlyArray<{ sellerId: string; shopName: string; revenue: number }>;
};

const CURRENCY = 'ARS';

export async function getAdminStats(
  opts: { dateFrom?: Date; dateTo?: Date } = {},
): Promise<AdminStats> {
  const saleWhere: Prisma.SaleWhereInput = {};
  if (opts.dateFrom || opts.dateTo) {
    saleWhere.createdAt = { gte: opts.dateFrom, lte: opts.dateTo };
  }

  const [
    totalProducts,
    statusGroups,
    hiddenProducts,
    totalSales,
    revenueAgg,
    categoryRows,
    sellerGroups,
  ] = await prisma.$transaction([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.product.count({ where: { deletedAt: null, hiddenByAdmin: true } }),
    prisma.sale.count({ where: saleWhere }),
    prisma.sale.aggregate({ where: saleWhere, _sum: { total: true } }),
    prisma.categoria.findMany({
      orderBy: { products: { _count: 'desc' } },
      take: 5,
      select: {
        id: true,
        name: true,
        _count: { select: { products: { where: { deletedAt: null } } } },
      },
    }),
    prisma.sale.groupBy({
      by: ['sellerId'],
      where: saleWhere,
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    }),
  ]);

  const productsByStatus = { active: 0, paused: 0 };
  for (const g of statusGroups) {
    productsByStatus[g.status] = g._count._all;
  }

  // Resolver shopName de los top sellers en una sola query extra.
  const sellerIds = sellerGroups.map((g) => g.sellerId);
  const sellers = sellerIds.length
    ? await prisma.seller.findMany({
        where: { id: { in: sellerIds } },
        select: { id: true, shopName: true },
      })
    : [];
  const shopNameById = new Map(sellers.map((s) => [s.id, s.shopName]));

  return {
    totalProducts,
    productsByStatus,
    hiddenProducts,
    totalSales,
    totalRevenue: revenueAgg._sum.total?.toNumber() ?? 0,
    currency: CURRENCY,
    topCategories: categoryRows.map((c) => ({
      categoryId: c.id,
      name: c.name,
      count: c._count.products,
    })),
    topSellers: sellerGroups.map((g) => ({
      sellerId: g.sellerId,
      shopName: shopNameById.get(g.sellerId) ?? '',
      revenue: g._sum.total?.toNumber() ?? 0,
    })),
  };
}
