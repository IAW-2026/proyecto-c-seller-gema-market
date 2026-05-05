import 'server-only';
import { countProductsByStatus, getTopProducts } from "@/lib/data/products";
import { getRecentSellerOrders, getActiveSellerOrders } from "@/lib/data/orders";
import type { DashboardData } from "@/types/domain";

export function getDashboardData(): DashboardData {
  const orders = getActiveSellerOrders();
  const monthlySales = orders.reduce((sum, order) => sum + order.total, 0);
  const productCounts = countProductsByStatus();

  return {
    stats: [
      { id: "monthlySales", value: monthlySales, delta: 12, trend: "up" },
      { id: "orders", value: orders.length, delta: 4, trend: "up" },
      { id: "activeProducts", value: productCounts.active, delta: null, trend: "flat" },
    ],
    topProducts: getTopProducts(4),
    recentOrders: getRecentSellerOrders(4),
  };
}
