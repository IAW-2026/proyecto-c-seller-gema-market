import { Suspense } from "react";
import type { Metadata } from "next";
import { ShopScreen } from "@/components/screens/shop-screen";
import { getCurrentSeller } from "@/lib/auth/current-seller";
import { saveSellerAction, uploadSellerCoverAction } from "@/app/shop/actions";

export const metadata: Metadata = {
  title: "Mi tienda",
};

export default function ShopPage() {
  return (
    <Suspense>
      <ShopContent />
    </Suspense>
  );
}

async function ShopContent() {
  const seller = await getCurrentSeller();
  return (
    <ShopScreen
      seller={seller}
      onSaveAction={saveSellerAction}
      onUploadCoverAction={uploadSellerCoverAction}
    />
  );
}
