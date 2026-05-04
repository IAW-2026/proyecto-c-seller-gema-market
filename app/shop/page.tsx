import type { Metadata } from "next";
import { ShopScreen } from "@/components/screens/shop-screen";
import { getCurrentSeller } from "@/lib/current-seller";
import { saveSellerAction, uploadSellerCoverAction } from "@/app/shop/actions";

export const metadata: Metadata = {
  title: "Mi tienda",
};

export default async function ShopPage() {
  const seller = await getCurrentSeller();
  return (
    <ShopScreen
      seller={seller}
      onSaveAction={saveSellerAction}
      onUploadCoverAction={uploadSellerCoverAction}
    />
  );
}
