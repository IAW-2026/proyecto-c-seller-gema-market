import type { Metadata } from "next";
import { ProductsScreen } from "@/components/screens/products-screen";
import { getCurrentSeller } from "@/lib/current-seller";
import { countProductsByStatus, listProducts } from "@/lib/data/products";
import type { ProductStatus } from "@/types/domain";

export const metadata: Metadata = {
  title: "Publicaciones",
};

type ProductsPageProps = {
  searchParams: Promise<{ q?: string; tab?: string }>;
};

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const seller = await getCurrentSeller();
  const { q = "", tab = "active" } = await searchParams;
  const activeTab: ProductStatus = tab === "paused" ? "paused" : "active";

  const filtered = listProducts({ query: q, status: activeTab });
  const counts = countProductsByStatus();

  return (
    <ProductsScreen
      seller={seller}
      products={filtered}
      query={q}
      activeTab={activeTab}
      counts={counts}
    />
  );
}
