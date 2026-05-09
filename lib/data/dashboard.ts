import 'server-only';
import { prisma } from '@/lib/db';
import { countProductsByStatus, getTopProducts } from "@/lib/data/products";
import { getRecentSellerOrders } from "@/lib/data/orders";
import type { DashboardData } from "@/types/domain";

const DAY_MS = 24 * 60 * 60 * 1000;
const SALES_WINDOW_DAYS = 30;

export async function getDashboardData(sellerId: string): Promise<DashboardData> {
  const salesWindowCutoff = new Date(Date.now() - SALES_WINDOW_DAYS * DAY_MS);
  const recentOrdersWhere = {
    sellerId,
    createdAt: { gte: salesWindowCutoff },
  };

  const [productCounts, recentSalesAgg, orderCount, topProducts, recentOrders] =
    await Promise.all([
      countProductsByStatus(sellerId),
      prisma.sale.aggregate({
        where: recentOrdersWhere,
        _sum: { total: true },
      }),
      prisma.sale.count({ where: recentOrdersWhere }),
      getTopProducts(4, sellerId),
      getRecentSellerOrders(4, sellerId),
    ]);

  const recentSales = recentSalesAgg._sum.total?.toNumber() ?? 0;

  return {
    stats: [
      { id: "monthlySales",   value: recentSales },
      { id: "orders",         value: orderCount },
      { id: "activeProducts", value: productCounts.active },
    ],
    topProducts,
    recentOrders,
  };
}
