import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { StockScreen } from "@/components/screens/stock-screen";
import { StockToolbar } from "@/components/screens/stock-toolbar";
import { StockSkeleton } from "@/components/screens/skeletons/stock-skeleton";
import { ToolbarSkeleton } from "@/components/screens/skeletons/skeleton-parts";
import { getCurrentSeller } from "@/lib/auth/current-seller";
import { getStockSummary, listProducts } from "@/lib/data/products";

export const metadata: Metadata = {
  title: "Stock",
};

type SearchParams = Promise<{
  q?: string;
  page?: string;
  pageSize?: string;
}>;

type StockPageProps = {
  searchParams: SearchParams;
};

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
      <ToolbarSkeleton withSearch />
    </div>
  );
}

async function StockToolbarLoader({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <StockToolbar initialQuery={params.q ?? ""} />;
}

async function StockContent({ searchParams }: { searchParams: SearchParams }) {
  const [seller, params] = await Promise.all([getCurrentSeller(), searchParams]);
  const q = params.q ?? "";
  const pageNum = Number.parseInt(params.page ?? "1", 10);
  const pageSizeNum = Number.parseInt(params.pageSize ?? "", 10);

  const [result, summary] = await Promise.all([
    listProducts({
      sellerId: seller.id,
      query: q,
      page: Number.isFinite(pageNum) ? pageNum : 1,
      pageSize: Number.isFinite(pageSizeNum) ? pageSizeNum : undefined,
    }),
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
