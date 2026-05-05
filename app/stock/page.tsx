import { Suspense } from "react";
import type { Metadata } from "next";
import { StockScreen } from "@/components/screens/stock-screen";
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
    <Suspense>
      <StockContent searchParams={searchParams} />
    </Suspense>
  );
}

async function StockContent({ searchParams }: StockPageProps) {
  const params = await searchParams;
  const q = params.q ?? "";
  const pageNum = Number.parseInt(params.page ?? "1", 10);
  const pageSizeNum = Number.parseInt(params.pageSize ?? "", 10);

  const result = listProducts({
    query: q,
    page: Number.isFinite(pageNum) ? pageNum : 1,
    pageSize: Number.isFinite(pageSizeNum) ? pageSizeNum : undefined,
  });
  const summary = getStockSummary();

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
