import type { Metadata } from "next";
import { ProductsScreen } from "@/components/screens/products-screen";
import { getCurrentSeller } from "@/lib/current-seller";
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

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const seller = await getCurrentSeller();
  const params = await searchParams;
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
    query: q,
    status: activeTab,
    sortBy,
    stockFilter: stockFilterVal,
    page: Number.isFinite(pageNum) ? pageNum : 1,
    pageSize: Number.isFinite(pageSizeNum) ? pageSizeNum : undefined,
  });
  const counts = countProductsByStatus();

  return (
    <ProductsScreen
      seller={seller}
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
