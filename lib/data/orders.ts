import type { Order, OrderStatus, Page, PageSize } from "@/types/domain";
import { PAGE_SIZES } from "@/types/domain";

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

export type OrderFilters = {
  status?: OrderListStatus;
  query?: string;
  page?: number;
  pageSize?: number;
};

export const DEFAULT_ORDERS_PAGE_SIZE: PageSize = 20;

function filterOrders(filters: OrderFilters): ReadonlyArray<Order> {
  const status = filters.status ?? "todos";
  const normalizedQuery = filters.query?.trim().toLowerCase();

  return getSellerOrders().filter((order) => {
    const matchesStatus = status === "todos" ? true : order.status === status;
    if (!matchesStatus) return false;
    if (!normalizedQuery) return true;
    return (
      order.id.toLowerCase().includes(normalizedQuery) ||
      order.buyer.toLowerCase().includes(normalizedQuery) ||
      order.trackId.toLowerCase().includes(normalizedQuery)
    );
  });
}

function resolvePageSize(value: number | undefined, fallback: PageSize): PageSize {
  return (PAGE_SIZES as ReadonlyArray<number>).includes(value ?? -1)
    ? (value as PageSize)
    : fallback;
}

export function listSellerOrders(filters: OrderFilters = {}): Page<Order> {
  const all = filterOrders(filters);
  const total = all.length;
  const pageSize = resolvePageSize(filters.pageSize, DEFAULT_ORDERS_PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const requested = Math.max(1, Math.floor(filters.page ?? 1));
  const page = Math.min(requested, totalPages);
  const offset = (page - 1) * pageSize;
  const items = all.slice(offset, offset + pageSize);
  return { items, total, page, pageSize };
}

export function countSellerOrdersByStatus(): Record<
  "todos" | "preparando" | "en_camino" | "entregado",
  number
> {
  const orders = getSellerOrders();
  return {
    todos: orders.length,
    preparando: orders.filter((o) => o.status === "preparando").length,
    en_camino: orders.filter((o) => o.status === "en_camino").length,
    entregado: orders.filter((o) => o.status === "entregado").length,
  };
}

export function getRecentSellerOrders(limit: number): ReadonlyArray<Order> {
  return getSellerOrders().slice(0, limit);
}
