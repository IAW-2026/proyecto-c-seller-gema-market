// ─── Dashboard ─────────────────────────────────────────────────────────────

import type { ProductWithJoins } from "./product";
import type { Order } from "./order";

export type DashboardStatId = "monthlySales" | "orders" | "activeProducts";

export type DashboardStat = {
  id: DashboardStatId;
  value: number;
  delta: number | null;
  trend: "up" | "flat";
};

export type DashboardData = {
  stats: ReadonlyArray<DashboardStat>;
  topProducts: ReadonlyArray<ProductWithJoins>;
  recentOrders: ReadonlyArray<Order>;
};
