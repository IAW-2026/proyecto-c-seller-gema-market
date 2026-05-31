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
