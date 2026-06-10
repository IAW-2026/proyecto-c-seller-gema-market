import 'server-only';
import { Prisma, type SaleStatus } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/db';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  type Page,
  type PageSize,
} from '@/types/domain';

// Reporte global de ventas (read-only) para el panel admin: todas las ventas
// del marketplace con nombre de producto y de tienda. A diferencia de
// `lib/data/orders.ts`, no se scopea por seller y no expone datos del comprador
// más allá del nombre.

export type AdminSaleRow = {
  id: string;
  orderId: string;
  productTitle: string;
  sellerShopName: string;
  buyerName: string;
  total: number;
  status: SaleStatus;
  trackingCode: string | null;
  createdAt: Date;
};

export type AdminSaleFilters = {
  query?: string;
  status?: SaleStatus;
  page?: number;
  pageSize?: number;
};

function resolvePageSize(value: number | undefined): PageSize {
  return (PAGE_SIZES as ReadonlyArray<number>).includes(value ?? -1)
    ? (value as PageSize)
    : DEFAULT_PAGE_SIZE;
}

export async function listAllSales(
  filters: AdminSaleFilters = {},
): Promise<Page<AdminSaleRow>> {
  const query = filters.query?.trim();
  const conditions: Prisma.SaleWhereInput[] = [];
  if (filters.status) conditions.push({ status: filters.status });
  if (query) {
    conditions.push({
      OR: [
        { product: { title: { contains: query, mode: 'insensitive' } } },
        { seller: { shopName: { contains: query, mode: 'insensitive' } } },
        { buyerName: { contains: query, mode: 'insensitive' } },
      ],
    });
  }
  const where: Prisma.SaleWhereInput = conditions.length ? { AND: conditions } : {};

  const pageSize = resolvePageSize(filters.pageSize);
  const requested = Math.max(1, Math.floor(filters.page ?? 1));
  const total = await prisma.sale.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, totalPages);
  const offset = (page - 1) * pageSize;

  const rows = await prisma.sale.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: pageSize,
    select: {
      id: true,
      orderId: true,
      buyerName: true,
      total: true,
      status: true,
      trackingCode: true,
      createdAt: true,
      product: { select: { title: true } },
      seller: { select: { shopName: true } },
    },
  });

  return {
    items: rows.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      productTitle: r.product.title,
      sellerShopName: r.seller.shopName,
      buyerName: r.buyerName,
      total: r.total.toNumber(),
      status: r.status,
      trackingCode: r.trackingCode,
      createdAt: r.createdAt,
    })),
    total,
    page,
    pageSize,
  };
}

// ─── API admin (Control Plane / Analytics) ─────────────────────────────────
//
// Variante para la API admin server-to-server. Expone los IDs correlacionales
// (order_id, product_id, seller_id, buyer_id) y `fee` que la UI no necesita.
// Paginación al estilo `listPublicProducts` (page_size libre 1..100).
//
// Nota de contrato: el campo `amount` del JSON es el monto (Sale.total), no la
// cantidad de unidades (Sale.amount). Ver docs/apis.md.

export type AdminSaleApiSortBy = 'created_at' | 'total';
export type AdminApiOrder = 'asc' | 'desc';

export type AdminSaleApiRow = {
  id: string;
  orderId: string;
  productId: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  amount: number; // Sale.total
  fee: number;
  status: SaleStatus;
  trackingCode: string | null;
  createdAt: Date;
};

export type AdminSaleApiPage = {
  items: AdminSaleApiRow[];
  page: number;
  pageSize: number;
  total: number;
  sortBy: AdminSaleApiSortBy;
  order: AdminApiOrder;
};

export type AdminSaleApiFilters = {
  sellerId?: string;
  status?: SaleStatus;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: AdminSaleApiSortBy;
  order?: AdminApiOrder;
  page?: number;
  pageSize?: number;
};

export async function listAdminSales(
  filters: AdminSaleApiFilters,
): Promise<AdminSaleApiPage> {
  const sortBy = filters.sortBy ?? 'created_at';
  const order = filters.order ?? 'desc';
  const pageSize = filters.pageSize ?? 20;
  const requested = Math.max(1, Math.floor(filters.page ?? 1));

  const where: Prisma.SaleWhereInput = {
    sellerId: filters.sellerId,
    status: filters.status,
  };
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = { gte: filters.dateFrom, lte: filters.dateTo };
  }

  const orderBy: Prisma.SaleOrderByWithRelationInput =
    sortBy === 'total' ? { total: order } : { createdAt: order };

  const total = await prisma.sale.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, totalPages);
  const offset = (page - 1) * pageSize;

  const rows = await prisma.sale.findMany({
    where,
    orderBy,
    skip: offset,
    take: pageSize,
    select: {
      id: true,
      orderId: true,
      productId: true,
      sellerId: true,
      buyerId: true,
      buyerName: true,
      total: true,
      fee: true,
      status: true,
      trackingCode: true,
      createdAt: true,
    },
  });

  return {
    items: rows.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      productId: r.productId,
      sellerId: r.sellerId,
      buyerId: r.buyerId,
      buyerName: r.buyerName,
      amount: r.total.toNumber(),
      fee: r.fee.toNumber(),
      status: r.status,
      trackingCode: r.trackingCode,
      createdAt: r.createdAt,
    })),
    page,
    pageSize,
    total,
    sortBy,
    order,
  };
}
