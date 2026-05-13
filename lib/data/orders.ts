import 'server-only';
import { cacheTag } from 'next/cache';
import { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/db';
import type {
  Order,
  OrderDateRange,
  OrderFilters,
  OrderListStatus,
  OrderWithJoins,
  Page,
  PageSize,
} from "@/types/domain";
import { DEFAULT_PAGE_SIZE, nextOrderStatus, PAGE_SIZES } from "@/types/domain";

type SaleRow = Prisma.SaleGetPayload<Record<string, never>>;

function toOrder(row: SaleRow): Order {
  const { total, fee, ...rest } = row;
  return { ...rest, total: total.toNumber(), fee: fee.toNumber() };
}

const saleWithProductSelect = {
  id: true,
  orderId: true,
  productId: true,
  sellerId: true,
  buyerId: true,
  buyerName: true,
  paymentId: true,
  amount: true,
  total: true,
  fee: true,
  status: true,
  trackingCode: true,
  createdAt: true,
  updatedAt: true,
  product: { select: { title: true } },
} satisfies Prisma.SaleSelect;

type SaleWithProductRow = Prisma.SaleGetPayload<{ select: typeof saleWithProductSelect }>;

function toOrderWithJoins(row: SaleWithProductRow): OrderWithJoins {
  const { product, total, fee, ...rest } = row;
  return {
    ...rest,
    total: total.toNumber(),
    fee: fee.toNumber(),
    productTitle: product.title,
  };
}


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

function dateRangeCutoff(range: OrderDateRange): Date | undefined {
  if (range === "all") return undefined;
  return new Date(Date.now() - RANGE_TO_DAYS[range] * 24 * 60 * 60 * 1000);
}

function buildWhere(filters: OrderFilters): Prisma.SaleWhereInput {
  const status = filters.status ?? "todos";
  const cutoff = dateRangeCutoff(filters.dateRange ?? DEFAULT_ORDER_DATE_RANGE);
  const query = filters.query?.trim();

  const conditions: Prisma.SaleWhereInput[] = [];
  if (status !== "todos") conditions.push({ status });
  if (filters.sellerId) conditions.push({ sellerId: filters.sellerId });
  if (cutoff) conditions.push({ createdAt: { gte: cutoff } });
  if (query) {
    conditions.push({
      OR: [
        { product: { title: { contains: query, mode: "insensitive" } } },
        { buyerName: { contains: query, mode: "insensitive" } },
      ],
    });
  }
  return { AND: conditions };
}

function resolvePageSize(value: number | undefined, fallback: PageSize): PageSize {
  return (PAGE_SIZES as ReadonlyArray<number>).includes(value ?? -1)
    ? (value as PageSize)
    : fallback;
}

// Lookup scopeado al seller dueño. Es la única forma de leer un pedido en
// el panel: nunca queremos exponer datos del comprador (envío, pago) por
// adivinar el `id` en la URL.
export async function findOwnedOrder(
  id: string,
  sellerId: string,
): Promise<Order | null> {
  "use cache";
  cacheTag(`order:${id}`);
  const row = await prisma.sale.findFirst({ where: { id, sellerId } });
  return row ? toOrder(row) : null;
}

export async function listSellerOrders(
  filters: OrderFilters = {},
): Promise<Page<OrderWithJoins>> {
  const where = buildWhere(filters);
  const pageSize = resolvePageSize(filters.pageSize, DEFAULT_PAGE_SIZE);
  const requested = Math.max(1, Math.floor(filters.page ?? 1));
  const total = await prisma.sale.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, totalPages);
  const offset = (page - 1) * pageSize;
  const rows = await prisma.sale.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: pageSize,
    select: saleWithProductSelect,
  });
  return { items: rows.map(toOrderWithJoins), total, page, pageSize };
}

// Wrapper cacheado para listings sin búsqueda libre. Las páginas hacen el
// switch: con `query` van a `listSellerOrders`, sin query van acá.
export async function listSellerOrdersCached(
  sellerId: string,
  status: OrderListStatus | undefined,
  dateRange: OrderDateRange,
  page: number,
  pageSize: number | undefined,
): Promise<Page<OrderWithJoins>> {
  "use cache";
  cacheTag(`orders-listing:${sellerId}`);
  return listSellerOrders({ sellerId, status, dateRange, page, pageSize });
}

export async function countSellerOrdersByStatus(
  sellerId?: string,
): Promise<Record<"todos" | "paid" | "shipping" | "delivered", number>> {
  "use cache";
  cacheTag(`orders-counts:${sellerId ?? 'all'}`);
  const groups = await prisma.sale.groupBy({
    by: ["status"],
    where: sellerId ? { sellerId } : undefined,
    _count: { _all: true },
  });
  const out = { todos: 0, paid: 0, shipping: 0, delivered: 0 };
  for (const g of groups) {
    out.todos += g._count._all;
    if (g.status === "paid") out.paid = g._count._all;
    else if (g.status === "shipping") out.shipping = g._count._all;
    else if (g.status === "delivered") out.delivered = g._count._all;
  }
  return out;
}

export async function getRecentSellerOrders(
  limit: number,
  sellerId?: string,
): Promise<ReadonlyArray<OrderWithJoins>> {
  const rows = await prisma.sale.findMany({
    where: sellerId ? { sellerId } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: saleWithProductSelect,
  });
  return rows.map(toOrderWithJoins);
}

export { nextOrderStatus };

export async function advanceOrderStatus(
  orderId: string,
  sellerId: string,
): Promise<Order> {
  // El check por `sellerId` previene que un seller avance pedidos ajenos.
  const current = await prisma.sale.findFirst({ where: { id: orderId, sellerId } });
  if (!current) {
    throw new Error(`advanceOrderStatus: pedido ${orderId} no encontrado`);
  }
  const next = nextOrderStatus(current.status);
  if (!next) {
    throw new Error(
      `advanceOrderStatus: no hay siguiente estado desde ${current.status}`,
    );
  }
  const updated = await prisma.sale.update({
    where: { id: orderId },
    data: { status: next },
  });
  return toOrder(updated);
}
