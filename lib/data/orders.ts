import type { Order, OrderStatus } from "@/types/domain";

export const ORDERS: ReadonlyArray<Order> = [
  { id: "OR-2841", date: "22 abr 2026", status: "en_camino", items: 2, total: 113500, buyer: "Lucía M.", address: "Av. Alem 1253, Bahía Blanca", trackId: "TRK-9821" },
  { id: "OR-2840", date: "21 abr 2026", status: "preparando", items: 1, total: 24500, buyer: "Mateo R.", address: "Donado 845, B. Blanca", trackId: "TRK-9820" },
  { id: "OR-2839", date: "20 abr 2026", status: "entregado", items: 3, total: 67400, buyer: "Sofía G.", address: "Brown 510, B. Blanca", trackId: "TRK-9819" },
  { id: "OR-2838", date: "18 abr 2026", status: "pago_pendiente", items: 1, total: 18900, buyer: "Tomás P.", address: "Soler 2230, B. Blanca", trackId: "TRK-9818" },
  { id: "OR-2837", date: "16 abr 2026", status: "entregado", items: 2, total: 41200, buyer: "Camila V.", address: "O'Higgins 1100, B. Blanca", trackId: "TRK-9817" },
];

export function findOrder(id: string): Order | undefined {
  return ORDERS.find((o) => o.id === id);
}

export function getSellerOrders(): ReadonlyArray<Order> {
  return ORDERS.filter((o) => o.status !== "pago_pendiente");
}

export type OrderListStatus = OrderStatus | "todos";

export function listSellerOrders(status: OrderListStatus = "todos"): ReadonlyArray<Order> {
  const orders = getSellerOrders();

  return status === "todos"
    ? orders
    : orders.filter((order) => order.status === status);
}

export function countSellerOrdersByStatus(): Record<
  "todos" | "preparando" | "en_camino" | "entregado",
  number
> {
  const orders = getSellerOrders();

  return {
    todos: orders.length,
    preparando: listSellerOrders("preparando").length,
    en_camino: listSellerOrders("en_camino").length,
    entregado: listSellerOrders("entregado").length,
  };
}

export function getRecentSellerOrders(limit: number): ReadonlyArray<Order> {
  return getSellerOrders().slice(0, limit);
}
