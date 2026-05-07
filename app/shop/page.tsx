import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopScreen } from "@/components/screens/shop-screen";
import { ShopSkeleton } from "@/components/screens/skeletons/shop-skeleton";
import { getCurrentSeller } from "@/lib/auth/current-seller";
import { findSellerWithCounts } from "@/lib/data/sellers";
import { saveSellerAction, uploadSellerCoverAction } from "@/app/shop/actions";

export const metadata: Metadata = {
  title: "Mi tienda",
};

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopContent />
    </Suspense>
  );
}

async function ShopContent() {
  const current = await getCurrentSeller();
  const seller = await findSellerWithCounts(current.id);
  if (!seller) notFound();
  return (
    <ShopScreen
      seller={seller}
      onSaveAction={saveSellerAction}
      onUploadCoverAction={uploadSellerCoverAction}
    />
  );
}
