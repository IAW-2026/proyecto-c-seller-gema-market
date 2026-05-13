import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { StockScreen } from "@/components/screens/stock-screen";
import { StockToolbar } from "@/components/screens/stock-toolbar";
import { StockSkeleton } from "@/components/screens/skeletons/stock-skeleton";
import { ToolbarSkeleton } from "@/components/screens/skeletons/skeleton-parts";
import { requireSeller } from "@/lib/auth/current-seller";
import {
  getStockSummary,
  listProducts,
  listProductsCached,
} from "@/lib/data/products";
import type { ProductStatus, SortBy } from "@/types/domain";

export const metadata: Metadata = {
  title: "Stock",
};

type SearchParams = Promise<{
  q?: string;
  sort?: string;
  status?: string;
  page?: string;
  pageSize?: string;
}>;

type StockPageProps = {
  searchParams: SearchParams;
};

const STOCK_SORTS: ReadonlyArray<SortBy> = ["stock_asc", "stock_desc"];
const STATUS_FILTERS: ReadonlyArray<ProductStatus> = ["active", "paused"];

function parseSort(value: string | undefined): SortBy | undefined {
  return STOCK_SORTS.includes(value as SortBy) ? (value as SortBy) : undefined;
}

function parseStatusFilter(value: string | undefined): ProductStatus | undefined {
  return STATUS_FILTERS.includes(value as ProductStatus)
    ? (value as ProductStatus)
    : undefined;
}

export default function StockPage({ searchParams }: StockPageProps) {
  return (
    <>
      <PageHeader subtitle="Inventario" title="Gestión de stock" />
      <div className="p-4 pb-16 lgx:px-7 lgx:py-6">
        <Suspense fallback={<FiltersFallback />}>
          <StockToolbarLoader searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={<StockSkeleton />}>
          <StockContent searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

function FiltersFallback() {
  return (
    <div className="mb-4">
      <ToolbarSkeleton withSearch withSecondary />
    </div>
  );
}

async function StockToolbarLoader({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <StockToolbar initialQuery={params.q ?? ""} />;
}

async function StockContent({ searchParams }: { searchParams: SearchParams }) {
  const [seller, params] = await Promise.all([requireSeller(), searchParams]);
  const q = params.q ?? "";
  const sortBy = parseSort(params.sort);
  const statusFilter = parseStatusFilter(params.status);
  const pageNum = Number.parseInt(params.page ?? "1", 10);
  const pageSizeNum = Number.parseInt(params.pageSize ?? "", 10);
  const page = Number.isFinite(pageNum) ? pageNum : 1;
  const pageSize = Number.isFinite(pageSizeNum) ? pageSizeNum : undefined;

  const [result, summary] = await Promise.all([
    q
      ? listProducts({
          sellerId: seller.id,
          query: q,
          status: statusFilter,
          sortBy,
          page,
          pageSize,
        })
      : listProductsCached(seller.id, statusFilter, sortBy, undefined, page, pageSize),
    getStockSummary(seller.id),
  ]);

  return (
    <StockScreen
      products={result.items}
      page={result.page}
      pageSize={result.pageSize}
      total={result.total}
      summary={summary}
    />
  );
}
