// ─── Dashboard ─────────────────────────────────────────────────────────────

import type { Product } from "./product";
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
  topProducts: ReadonlyArray<Product>;
  recentOrders: ReadonlyArray<Order>;
};
