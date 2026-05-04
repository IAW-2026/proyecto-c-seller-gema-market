import { fmtARS } from "@/lib/format";
import { countProductsByStatus, getTopProducts } from "@/lib/data/products";
import { getRecentSellerOrders, getSellerOrders } from "@/lib/data/orders";
import type { Order, Product } from "@/types/domain";

export type DashboardStat = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "flat";
};

export type DashboardData = {
  stats: ReadonlyArray<DashboardStat>;
  salesChartBars: ReadonlyArray<number>;
  topProducts: ReadonlyArray<Product>;
  recentOrders: ReadonlyArray<Order>;
};

const SALES_CHART_BARS: ReadonlyArray<number> = [
  42, 58, 35, 80, 65, 90, 70, 110, 88, 76, 120, 95, 130, 105,
];

export function getDashboardData(): DashboardData {
  const orders = getSellerOrders();
  const monthlySales = orders.reduce((sum, order) => sum + order.total, 0);
  const productCounts = countProductsByStatus();

  return {
    stats: [
      { label: "Ventas del mes", value: fmtARS(monthlySales), delta: "+12%", trend: "up" },
      { label: "Pedidos", value: String(orders.length), delta: "+4", trend: "up" },
      { label: "Productos activos", value: String(productCounts.active), delta: "-", trend: "flat" },
    ],
    salesChartBars: SALES_CHART_BARS,
    topProducts: getTopProducts(4),
    recentOrders: getRecentSellerOrders(4),
  };
}
