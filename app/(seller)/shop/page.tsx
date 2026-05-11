import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ShopScreen } from "@/components/screens/shop-screen";
import { ShopSkeleton } from "@/components/screens/skeletons/shop-skeleton";
import { requireSeller } from "@/lib/auth/current-seller";
import { findSellerWithCounts } from "@/lib/data/sellers";

export const metadata: Metadata = {
  title: "Mi tienda",
};

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopFallback />}>
      <ShopContent />
    </Suspense>
  );
}

function ShopFallback() {
  return (
    <>
      <PageHeader subtitle="Pública" title="Perfil de tienda" />
      <ShopSkeleton />
    </>
  );
}

async function ShopContent() {
  const current = await requireSeller();
  const seller = await findSellerWithCounts(current.id);
  if (!seller) notFound();
  return <ShopScreen seller={seller} />;
}
