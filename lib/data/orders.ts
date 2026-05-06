import 'server-only';
import { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/db';
import type {
  Order,
  OrderDateRange,
  OrderFilters,
  Page,
  PageSize,
} from "@/types/domain";
import { nextOrderStatus, PAGE_SIZES } from "@/types/domain";

type SaleRow = Prisma.SaleGetPayload<Record<string, never>>;

function toOrder(row: SaleRow): Order {
  const { total, fee, ...rest } = row;
  return { ...rest, total: total.toNumber(), fee: fee.toNumber() };
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

function dateRangeCutoff(range: OrderDateRange): Date | undefined {
  if (range === "all") return undefined;
  return new Date(Date.now() - RANGE_TO_DAYS[range] * 24 * 60 * 60 * 1000);
}

// El seller solo opera órdenes con pago confirmado.
const NON_PENDING: Prisma.SaleWhereInput = {
  status: { not: "pending_payment" },
};

function buildWhere(filters: OrderFilters): Prisma.SaleWhereInput {
  const status = filters.status ?? "todos";
  const cutoff = dateRangeCutoff(filters.dateRange ?? DEFAULT_ORDER_DATE_RANGE);
  const query = filters.query?.trim();

  const conditions: Prisma.SaleWhereInput[] = [
    status === "todos" ? NON_PENDING : { status },
  ];
  if (filters.sellerId) conditions.push({ sellerId: filters.sellerId });
  if (cutoff) conditions.push({ createdAt: { gte: cutoff } });
  if (query) {
    conditions.push({
      OR: [
        { id: { contains: query, mode: "insensitive" } },
        { orderId: { contains: query, mode: "insensitive" } },
        { buyerId: { contains: query, mode: "insensitive" } },
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

export async function findOrder(id: string): Promise<Order | null> {
  const row = await prisma.sale.findUnique({ where: { id } });
  return row ? toOrder(row) : null;
}

export async function listSellerOrders(
  filters: OrderFilters = {},
): Promise<Page<Order>> {
  const where = buildWhere(filters);
  const pageSize = resolvePageSize(filters.pageSize, DEFAULT_ORDERS_PAGE_SIZE);
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
  });
  return { items: rows.map(toOrder), total, page, pageSize };
}

export async function countSellerOrdersByStatus(
  sellerId?: string,
): Promise<Record<"todos" | "paid" | "shipping" | "delivered", number>> {
  const where: Prisma.SaleWhereInput = {
    AND: [NON_PENDING, sellerId ? { sellerId } : {}],
  };
  const groups = await prisma.sale.groupBy({
    by: ["status"],
    where,
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
): Promise<ReadonlyArray<Order>> {
  const rows = await prisma.sale.findMany({
    where: { AND: [NON_PENDING, sellerId ? { sellerId } : {}] },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toOrder);
}

export { nextOrderStatus };

export async function advanceOrderStatus(orderId: string): Promise<Order> {
  const current = await prisma.sale.findUnique({ where: { id: orderId } });
  if (!current) {
    throw new Error(`advanceOrderStatus: orden ${orderId} no existe`);
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
