import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { OrdersFiltersBar } from "@/components/screens/orders-filters-bar";
import { OrdersScreen } from "@/components/screens/orders-screen";
import { OrdersSkeleton } from "@/components/screens/skeletons/orders-skeleton";
import { FiltersBarSkeleton } from "@/components/screens/skeletons/skeleton-parts";
import { requireSeller } from "@/lib/auth/current-seller";
import {
  countSellerOrdersByStatus,
  DEFAULT_ORDER_DATE_RANGE,
  listSellerOrders,
  listSellerOrdersCached,
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

type SearchParams = Promise<{
  tab?: string;
  q?: string;
  range?: string;
  page?: string;
  pageSize?: string;
}>;

type OrdersPageProps = {
  searchParams: SearchParams;
};

export default function OrdersPage({ searchParams }: OrdersPageProps) {
  return (
    <>
      <PageHeader subtitle="Operaciones" title="Pedidos recibidos" />
      <div className="p-4 pb-16 lgx:px-7 lgx:py-6">
        <Suspense fallback={<FiltersFallback />}>
          <OrdersFiltersBarLoader searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={<OrdersSkeleton />}>
          <OrdersContent searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

function FiltersFallback() {
  return <FiltersBarSkeleton withSecondary />;
}

async function OrdersFiltersBarLoader({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <OrdersFiltersBar
      initialQuery={params.q ?? ""}
      dateRange={parseDateRange(params.range)}
      dateRangeOptions={ORDER_DATE_RANGE_OPTIONS}
    />
  );
}

async function OrdersContent({ searchParams }: { searchParams: SearchParams }) {
  const [seller, params] = await Promise.all([requireSeller(), searchParams]);
  const tab = params.tab ?? "todos";
  const activeTab = TAB_TO_STATUS[tab] ? tab : "todos";
  const q = params.q ?? "";
  const dateRange = parseDateRange(params.range);
  const pageNum = Number.parseInt(params.page ?? "1", 10);
  const pageSizeNum = Number.parseInt(params.pageSize ?? "", 10);
  const page = Number.isFinite(pageNum) ? pageNum : 1;
  const pageSize = Number.isFinite(pageSizeNum) ? pageSizeNum : undefined;
  const status = TAB_TO_STATUS[activeTab];

  const [result, rawCounts] = await Promise.all([
    q
      ? listSellerOrders({
          sellerId: seller.id,
          status,
          query: q,
          dateRange,
          page,
          pageSize,
        })
      : listSellerOrdersCached(seller.id, status, dateRange, page, pageSize),
    countSellerOrdersByStatus(seller.id),
  ]);

  return (
    <OrdersScreen
      orders={result.items}
      page={result.page}
      pageSize={result.pageSize}
      total={result.total}
      activeTab={activeTab}
      counts={{
        todos: rawCounts.todos,
        preparando: rawCounts.paid,
        en_camino: rawCounts.shipping,
        entregado: rawCounts.delivered,
      }}
    />
  );
}
