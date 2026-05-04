import type { Metadata } from "next";
import { DashboardScreen } from "@/components/screens/dashboard-screen";
import { getCurrentSeller } from "@/lib/current-seller";
import { getDashboardData } from "@/lib/data/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const seller = await getCurrentSeller();
  const dashboard = getDashboardData();
  return (
    <DashboardScreen
      seller={seller}
      recentOrders={dashboard.recentOrders}
      salesChartBars={dashboard.salesChartBars}
      stats={dashboard.stats}
      topProducts={dashboard.topProducts}
    />
  );
}
