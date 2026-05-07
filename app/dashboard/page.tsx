import { Suspense } from "react";
import type { Metadata } from "next";
import { DashboardScreen } from "@/components/screens/dashboard-screen";
import { DashboardSkeleton } from "@/components/screens/skeletons/dashboard-skeleton";
import { getCurrentSeller } from "@/lib/auth/current-seller";
import { getDashboardData } from "@/lib/data/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
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
