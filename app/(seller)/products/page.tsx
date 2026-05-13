import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ProductCreateFab } from "@/components/screens/product-create-fab";
import { ProductsFiltersBar } from "@/components/screens/products-filters-bar";
import { ProductsScreen } from "@/components/screens/products-screen";
import { ProductsSkeleton } from "@/components/screens/skeletons/products-skeleton";
import { FiltersBarSkeleton } from "@/components/screens/skeletons/skeleton-parts";
import { Button } from "@/components/ui/button";
import { requireSeller } from "@/lib/auth/current-seller";
import {
  countProductsByStatus,
  listProducts,
  listProductsCached,
} from "@/lib/data/products";
import type { ProductStatus, SortBy, StockFilter } from "@/types/domain";

export const metadata: Metadata = {
  title: "Publicaciones",
};

const VALID_SORTS: ReadonlyArray<string> = [
  "price_asc",
  "price_desc",
  "sales_asc",
  "sales_desc",
  "stock_asc",
  "stock_desc",
  "created_asc",
  "created_desc",
];
const VALID_STOCK_FILTERS: ReadonlyArray<string> = ["all", "low", "out"];

type SearchParams = Promise<{
  q?: string;
  tab?: string;
  sort?: string;
  stockFilter?: string;
  page?: string;
  pageSize?: string;
}>;

type ProductsPageProps = {
  searchParams: SearchParams;
};

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <>
      <PageHeader
        subtitle="Catálogo"
        title="Publicaciones"
        action={
          <Button href="/products/new" variant="accent" icon="plus">
            Nueva
          </Button>
        }
        hideActionOnMobile
      />
      <div className="p-4 pb-32 lgx:px-7 lgx:py-6">
        <Suspense fallback={<FiltersFallback />}>
          <ProductsFiltersBarLoader searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={<ProductsSkeleton />}>
          <ProductsContent searchParams={searchParams} />
        </Suspense>
      </div>
      <ProductCreateFab />
    </>
  );
}

function FiltersFallback() {
  return <FiltersBarSkeleton withSecondary />;
}

async function ProductsFiltersBarLoader({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <ProductsFiltersBar initialQuery={params.q ?? ""} />;
}

async function ProductsContent({ searchParams }: { searchParams: SearchParams }) {
  const [seller, params] = await Promise.all([requireSeller(), searchParams]);
  const q = params.q ?? "";
  const tab = params.tab ?? "active";
  const activeTab: ProductStatus = tab === "paused" ? "paused" : "active";
  const sortBy = VALID_SORTS.includes(params.sort ?? "") ? (params.sort as SortBy) : undefined;
  const stockFilter = VALID_STOCK_FILTERS.includes(params.stockFilter ?? "")
    ? (params.stockFilter as StockFilter)
    : undefined;
  const pageNum = Number.parseInt(params.page ?? "1", 10);
  const pageSizeNum = Number.parseInt(params.pageSize ?? "", 10);
  const page = Number.isFinite(pageNum) ? pageNum : 1;
  const pageSize = Number.isFinite(pageSizeNum) ? pageSizeNum : undefined;

  const [result, counts] = await Promise.all([
    q
      ? listProducts({
          sellerId: seller.id,
          query: q,
          status: activeTab,
          sortBy,
          stockFilter,
          page,
          pageSize,
        })
      : listProductsCached(seller.id, activeTab, sortBy, stockFilter, page, pageSize),
    countProductsByStatus(seller.id),
  ]);

  return (
    <ProductsScreen
      products={result.items}
      page={result.page}
      pageSize={result.pageSize}
      total={result.total}
      activeTab={activeTab}
      counts={counts}
    />
  );
}
