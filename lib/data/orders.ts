import type {
  Order,
  OrderDateRange,
  OrderFilters,
  OrderStatus,
  Page,
  PageSize,
} from "@/types/domain";
import { PAGE_SIZES } from "@/types/domain";
import { fmtOrderDate } from "@/lib/format";

type OrderSeed = Omit<Order, "date">;

// createdAt es la fuente de verdad (fuente: venta.created_at).
// `date` se computa a partir de createdAt en buildOrder.
const ORDER_SEEDS: ReadonlyArray<OrderSeed> = [
  { id: "OR-2841", createdAt: "2026-05-02T10:15:00Z", status: "shipping",        productId: "p1", amount: 1, total: 113500, fee: 6810, buyer: "Lucía M.",   buyerId: "buyer-001", address: "Av. Alem 1253, Bahía Blanca",    trackId: "TRK-9821", paymentId: "pay-001" },
  { id: "OR-2840", createdAt: "2026-04-28T14:42:00Z", status: "paid",            productId: "p2", amount: 1, total:  24500, fee: 1470, buyer: "Mateo R.",   buyerId: "buyer-002", address: "Donado 845, B. Blanca",          trackId: "TRK-9820", paymentId: "pay-002" },
  { id: "OR-2839", createdAt: "2026-04-20T09:05:00Z", status: "delivered",       productId: "p6", amount: 1, total:  67400, fee: 4044, buyer: "Sofía G.",   buyerId: "buyer-003", address: "Brown 510, B. Blanca",           trackId: "TRK-9819", paymentId: "pay-003" },
  { id: "OR-2838", createdAt: "2026-04-18T18:21:00Z", status: "pending_payment", productId: "p3", amount: 1, total:  18900, fee: 1134, buyer: "Tomás P.",   buyerId: "buyer-004", address: "Soler 2230, B. Blanca",          trackId: "TRK-9818", paymentId: "pay-004" },
  { id: "OR-2837", createdAt: "2026-02-10T11:30:00Z", status: "delivered",       productId: "p8", amount: 1, total:  41200, fee: 2472, buyer: "Camila V.",  buyerId: "buyer-005", address: "O'Higgins 1100, B. Blanca",      trackId: "TRK-9817", paymentId: "pay-005" },
];

function buildOrder(seed: OrderSeed): Order {
  return { ...seed, date: fmtOrderDate(seed.createdAt) };
}

// Las mutaciones del mock (advanceOrderStatus) requieren un array mutable.
// En el backend real, el data layer hará UPDATE en venta.
const ORDERS: Order[] = ORDER_SEEDS.map(buildOrder);

export function getOrders(): ReadonlyArray<Order> {
  return ORDERS;
}

export function findOrder(id: string): Order | undefined {
  return ORDERS.find((o) => o.id === id);
}

// Excluye explícitamente las ventas que aún no fueron pagadas:
// el seller sólo opera órdenes con pago confirmado.
export function getActiveSellerOrders(): ReadonlyArray<Order> {
  return ORDERS.filter((o) => o.status !== "pending_payment");
}

export const DEFAULT_ORDERS_PAGE_SIZE: PageSize = 10;

// ─── Filtros temporales ────────────────────────────────────────────────────

export const ORDER_DATE_RANGE_OPTIONS: ReadonlyArray<{
  id: OrderDateRange;
  label: string;
}> = [
  { id: "7d",  label: "Últimos 7 días" },
  { id: "30d", label: "Últimos 30 días" },
  { id: "90d", label: "Últimos 90 días" },
  { id: "all", label: "Todo el tiempo" },
];

export const DEFAULT_ORDER_DATE_RANGE: OrderDateRange = "30d";

const RANGE_TO_DAYS: Readonly<Record<Exclude<OrderDateRange, "all">, number>> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function isWithinRange(createdAt: string, range: OrderDateRange, now: Date): boolean {
  if (range === "all") return true;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  const cutoff = now.getTime() - RANGE_TO_DAYS[range] * 24 * 60 * 60 * 1000;
  return created >= cutoff;
}

function filterOrders(filters: OrderFilters): ReadonlyArray<Order> {
  const status = filters.status ?? "todos";
  const dateRange = filters.dateRange ?? DEFAULT_ORDER_DATE_RANGE;
  const normalizedQuery = filters.query?.trim().toLowerCase();
  const now = new Date();

  return getActiveSellerOrders().filter((order) => {
    const matchesStatus = status === "todos" ? true : order.status === status;
    if (!matchesStatus) return false;
    if (!isWithinRange(order.createdAt, dateRange, now)) return false;
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
  "todos" | "paid" | "shipping" | "delivered",
  number
> {
  const orders = getActiveSellerOrders();
  return {
    todos:    orders.length,
    paid:     orders.filter((o) => o.status === "paid").length,
    shipping: orders.filter((o) => o.status === "shipping").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };
}

export function getRecentSellerOrders(limit: number): ReadonlyArray<Order> {
  return getActiveSellerOrders().slice(0, limit);
}

// ─── Transición de estado ─────────────────────────────────────────────────

// Flujo bajo control del seller: paid → shipping.
// `delivered` lo setea otra app (Shipping) cuando confirma la entrega.
const STATUS_FLOW: Readonly<Partial<Record<OrderStatus, OrderStatus>>> = {
  paid: "shipping",
};

export function nextOrderStatus(current: OrderStatus): OrderStatus | null {
  return STATUS_FLOW[current] ?? null;
}

export async function advanceOrderStatus(orderId: string): Promise<Order> {
  const idx = ORDERS.findIndex((o) => o.id === orderId);
  const current = idx === -1 ? undefined : ORDERS[idx];
  if (!current) {
    throw new Error(`advanceOrderStatus: orden ${orderId} no existe`);
  }
  const next = nextOrderStatus(current.status);
  if (!next) {
    throw new Error(
      `advanceOrderStatus: no hay siguiente estado desde ${current.status}`,
    );
  }
  // TODO: implementar con Prisma — UPDATE venta SET status = next WHERE id = orderId
  const updated: Order = { ...current, status: next };
  ORDERS[idx] = updated;
  return updated;
}
