import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardScreen } from "@/components/screens/dashboard-screen";
import { DashboardSkeleton } from "@/components/screens/skeletons/dashboard-skeleton";
import { Button } from "@/components/ui/button";
import { SkeletonText } from "@/components/ui/skeleton";
import { getCurrentSeller } from "@/lib/auth/current-seller";
import { getDashboardData } from "@/lib/data/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        subtitle="Resumen"
        title={
          <Suspense fallback={<DashboardTitleFallback />}>
            <DashboardTitle />
          </Suspense>
        }
        action={
          <Button href="/products/new" variant="accent" icon="plus">
            Nueva publicación
          </Button>
        }
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </>
  );
}

async function DashboardTitle() {
  const seller = await getCurrentSeller();
  return `Hola, ${seller.shopName}`;
}

function DashboardTitleFallback() {
  return (
    <>
      <SkeletonText width={140} height={12} className="lgx:hidden" />
      <SkeletonText width={260} height={26} className="hidden lgx:block" />
    </>
  );
}

async function DashboardContent() {
  const seller = await getCurrentSeller();
  const dashboard = await getDashboardData(seller.id);
  return (
    <DashboardScreen
      recentOrders={dashboard.recentOrders}
      stats={dashboard.stats}
      topProducts={dashboard.topProducts}
    />
  );
}
