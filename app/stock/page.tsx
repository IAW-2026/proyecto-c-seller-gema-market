import { Suspense } from "react";
import type { Metadata } from "next";
import { StockScreen } from "@/components/screens/stock-screen";
import { StockSkeleton } from "@/components/screens/skeletons/stock-skeleton";
import { getCurrentSeller } from "@/lib/auth/current-seller";
import { getStockSummary, listProducts } from "@/lib/data/products";

export const metadata: Metadata = {
  title: "Stock",
};

type StockPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export default function StockPage({ searchParams }: StockPageProps) {
  return (
    <Suspense fallback={<StockSkeleton />}>
      <StockContent searchParams={searchParams} />
    </Suspense>
  );
}

async function StockContent({ searchParams }: StockPageProps) {
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
      query={q}
      summary={summary}
    />
  );
}
