import type { Metadata } from "next";
import { ShopScreen } from "@/components/screens/shop-screen";
import { getCurrentSeller } from "@/lib/current-seller";

export const metadata: Metadata = {
  title: "Mi tienda",
};

export default async function ShopPage() {
  const seller = await getCurrentSeller();
  return <ShopScreen seller={seller} />;
}
