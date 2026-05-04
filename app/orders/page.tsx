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
  searchParams: Promise<{ tab?: string }>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const seller = await getCurrentSeller();
  const { tab = "todos" } = await searchParams;
  const activeTab = TAB_TO_STATUS[tab] ? tab : "todos";
  const filtered = listSellerOrders(TAB_TO_STATUS[activeTab]);
  const counts = countSellerOrdersByStatus();

  return (
    <OrdersScreen
      seller={seller}
      orders={filtered}
      activeTab={activeTab}
      counts={counts}
    />
  );
}
