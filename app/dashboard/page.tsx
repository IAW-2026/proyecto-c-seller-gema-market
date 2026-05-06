import { Suspense } from "react";
import type { Metadata } from "next";
import { DashboardScreen } from "@/components/screens/dashboard-screen";
import { getCurrentSeller } from "@/lib/auth/current-seller";
import { getDashboardData } from "@/lib/data/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const seller = await getCurrentSeller();
  const dashboard = await getDashboardData(seller.id);
  return (
    <DashboardScreen
      seller={seller}
      recentOrders={dashboard.recentOrders}
      stats={dashboard.stats}
      topProducts={dashboard.topProducts}
    />
  );
}
