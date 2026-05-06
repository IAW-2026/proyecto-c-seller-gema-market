import 'server-only';
import { prisma } from '@/lib/db';
import { countProductsByStatus, getTopProducts } from "@/lib/data/products";
import { getRecentSellerOrders } from "@/lib/data/orders";
import type { DashboardData } from "@/types/domain";

export async function getDashboardData(sellerId: string): Promise<DashboardData> {
  const activeOrdersWhere = {
    sellerId,
    status: { not: "pending_payment" as const },
  };

  const [productCounts, orderAgg, orderCount, topProducts, recentOrders] =
    await Promise.all([
      countProductsByStatus(sellerId),
      prisma.sale.aggregate({ where: activeOrdersWhere, _sum: { total: true } }),
      prisma.sale.count({ where: activeOrdersWhere }),
      getTopProducts(4, sellerId),
      getRecentSellerOrders(4, sellerId),
    ]);

  const monthlySales = orderAgg._sum.total?.toNumber() ?? 0;

  return {
    stats: [
      { id: "monthlySales",   value: monthlySales,         delta: 12,   trend: "up" },
      { id: "orders",         value: orderCount,           delta: 4,    trend: "up" },
      { id: "activeProducts", value: productCounts.active, delta: null, trend: "flat" },
    ],
    topProducts,
    recentOrders,
  };
}
