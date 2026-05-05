import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductsScreen } from "@/components/screens/products-screen";
import { getCurrentSeller } from "@/lib/auth/current-seller";
import { countProductsByStatus, listProducts } from "@/lib/data/products";
import type { ProductStatus, SortBy, StockFilter } from "@/types/domain";

export const metadata: Metadata = {
  title: "Publicaciones",
};

const VALID_SORTS: ReadonlyArray<string> = ["price_asc", "price_desc", "sales_asc", "sales_desc", "stock_asc", "stock_desc"];
const VALID_STOCK_FILTERS: ReadonlyArray<string> = ["all", "low", "out"];

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    tab?: string;
    sort?: string;
    stockFilter?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <Suspense>
      <ProductsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ProductsContent({ searchParams }: ProductsPageProps) {
  const [seller, params] = await Promise.all([getCurrentSeller(), searchParams]);
  const q = params.q ?? "";
  const tab = params.tab ?? "active";
  const activeTab: ProductStatus = tab === "paused" ? "paused" : "active";
  const sortBy = VALID_SORTS.includes(params.sort ?? "") ? (params.sort as SortBy) : undefined;
  const stockFilterVal = VALID_STOCK_FILTERS.includes(params.stockFilter ?? "")
    ? (params.stockFilter as StockFilter)
    : undefined;
  const pageNum = Number.parseInt(params.page ?? "1", 10);
  const pageSizeNum = Number.parseInt(params.pageSize ?? "", 10);

  const result = listProducts({
    sellerId: seller.id,
    query: q,
    status: activeTab,
    sortBy,
    stockFilter: stockFilterVal,
    page: Number.isFinite(pageNum) ? pageNum : 1,
    pageSize: Number.isFinite(pageSizeNum) ? pageSizeNum : undefined,
  });
  const counts = countProductsByStatus(seller.id);

  return (
    <ProductsScreen
      products={result.items}
      page={result.page}
      pageSize={result.pageSize}
      total={result.total}
      query={q}
      activeTab={activeTab}
      counts={counts}
    />
  );
}
