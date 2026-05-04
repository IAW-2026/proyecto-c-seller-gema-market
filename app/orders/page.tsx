import type { Metadata } from "next";
import { OrdersScreen } from "@/components/screens/orders-screen";
import { getCurrentSeller } from "@/lib/current-seller";
import {
  countSellerOrdersByStatus,
  listSellerOrders,
} from "@/lib/data/orders";
import type { OrderStatus } from "@/types/domain";

export const metadata: Metadata = {
  title: "Pedidos",
};

const TAB_TO_STATUS: Record<string, OrderStatus | "todos"> = {
  todos: "todos",
  preparando: "preparando",
  en_camino: "en_camino",
  entregado: "entregado",
};

type OrdersPageProps = {
  searchParams: Promise<{
    tab?: string;
    q?: string;
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
  const pageNum = Number.parseInt(params.page ?? "1", 10);
  const pageSizeNum = Number.parseInt(params.pageSize ?? "", 10);

  const result = listSellerOrders({
    status: TAB_TO_STATUS[activeTab],
    query: q,
    page: Number.isFinite(pageNum) ? pageNum : 1,
    pageSize: Number.isFinite(pageSizeNum) ? pageSizeNum : undefined,
  });
  const counts = countSellerOrdersByStatus();

  return (
    <OrdersScreen
      seller={seller}
      orders={result.items}
      page={result.page}
      pageSize={result.pageSize}
      total={result.total}
      query={q}
      activeTab={activeTab}
      counts={counts}
    />
  );
}
