import type { Metadata } from "next";
import { OrdersScreen } from "@/components/screens/orders-screen";
import { getCurrentSeller } from "@/lib/auth/current-seller";
import {
  countSellerOrdersByStatus,
  DEFAULT_ORDER_DATE_RANGE,
  listSellerOrders,
  ORDER_DATE_RANGE_OPTIONS,
} from "@/lib/data/orders";
import type { OrderDateRange, OrderListStatus } from "@/types/domain";

export const metadata: Metadata = {
  title: "Pedidos",
};

const TAB_TO_STATUS: Record<string, OrderListStatus> = {
  todos: "todos",
  preparando: "paid",
  en_camino: "shipping",
  entregado: "delivered",
};

function parseDateRange(value: string | undefined): OrderDateRange {
  return ORDER_DATE_RANGE_OPTIONS.some((opt) => opt.id === value)
    ? (value as OrderDateRange)
    : DEFAULT_ORDER_DATE_RANGE;
}

type OrdersPageProps = {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    range?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const seller = await getCurrentSeller();
  const params = await searchParams;
  const tab = params.tab ?? "todos";
  const activeTab = TAB_TO_STATUS[tab] ? tab : "todos";
  const q = params.q ?? "";
  const dateRange = parseDateRange(params.range);
  const pageNum = Number.parseInt(params.page ?? "1", 10);
  const pageSizeNum = Number.parseInt(params.pageSize ?? "", 10);

  const result = listSellerOrders({
    status: TAB_TO_STATUS[activeTab],
    query: q,
    dateRange,
    page: Number.isFinite(pageNum) ? pageNum : 1,
    pageSize: Number.isFinite(pageSizeNum) ? pageSizeNum : undefined,
  });
  const rawCounts = countSellerOrdersByStatus();

  return (
    <OrdersScreen
      seller={seller}
      orders={result.items}
      page={result.page}
      pageSize={result.pageSize}
      total={result.total}
      query={q}
      activeTab={activeTab}
      dateRange={dateRange}
      dateRangeOptions={ORDER_DATE_RANGE_OPTIONS}
      counts={{
        todos: rawCounts.todos,
        preparando: rawCounts.paid,
        en_camino: rawCounts.shipping,
        entregado: rawCounts.delivered,
      }}
    />
  );
}
