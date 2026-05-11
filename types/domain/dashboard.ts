// ─── Dashboard ─────────────────────────────────────────────────────────────

import type { ProductWithJoins } from "./product";
import type { OrderWithJoins } from "./order";

export type DashboardStatId = "monthlySales" | "orders" | "activeProducts";

export type DashboardStat = {
  id: DashboardStatId;
  value: number;
};

export type DashboardData = {
  stats: ReadonlyArray<DashboardStat>;
  topProducts: ReadonlyArray<ProductWithJoins>;
  recentOrders: ReadonlyArray<OrderWithJoins>;
};
