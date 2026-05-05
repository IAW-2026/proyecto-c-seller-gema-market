import type { Metadata } from "next";
import { StockScreen } from "@/components/screens/stock-screen";
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

export default async function StockPage({ searchParams }: StockPageProps) {
  const seller = await getCurrentSeller();
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
      seller={seller}
      products={result.items}
      page={result.page}
      pageSize={result.pageSize}
      total={result.total}
      query={q}
      summary={summary}
    />
  );
}
