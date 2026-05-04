import type { Metadata } from "next";
import { StockScreen } from "@/components/screens/stock-screen";
import { getCurrentSeller } from "@/lib/current-seller";
import { listProducts } from "@/lib/data/products";

export const metadata: Metadata = {
  title: "Stock",
};

export default async function StockPage() {
  const seller = await getCurrentSeller();
  const products = listProducts();
  return <StockScreen seller={seller} products={products} />;
}
