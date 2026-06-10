import 'server-only';
import { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/db';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  type Page,
  type PageSize,
} from '@/types/domain';

// Capa de datos del panel admin: vista global de todos los sellers (sin scope
// por seller, a diferencia de `lib/data/sellers.ts`). Sin cache: el panel es de
// baja frecuencia y preferimos datos siempre frescos tras una moderación.

export type AdminSellerRow = {
  id: string;
  shopName: string;
  email: string;
  city: string;
  suspended: boolean;
  productsCount: number;
  salesCount: number;
  createdAt: Date;
};

export type AdminSellerFilters = {
  query?: string;
  page?: number;
  pageSize?: number;
};

function resolvePageSize(value: number | undefined): PageSize {
  return (PAGE_SIZES as ReadonlyArray<number>).includes(value ?? -1)
    ? (value as PageSize)
    : DEFAULT_PAGE_SIZE;
}

export async function listAllSellers(
  filters: AdminSellerFilters = {},
): Promise<Page<AdminSellerRow>> {
  const query = filters.query?.trim();
  const where: Prisma.SellerWhereInput = query
    ? {
        OR: [
          { shopName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      }
    : {};

  const pageSize = resolvePageSize(filters.pageSize);
  const requested = Math.max(1, Math.floor(filters.page ?? 1));
  const total = await prisma.seller.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, totalPages);
  const offset = (page - 1) * pageSize;

  const rows = await prisma.seller.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: pageSize,
    select: {
      id: true,
      shopName: true,
      email: true,
      city: true,
      suspended: true,
      createdAt: true,
      _count: { select: { products: { where: { deletedAt: null } }, sales: true } },
    },
  });

  return {
    items: rows.map((r) => ({
      id: r.id,
      shopName: r.shopName,
      email: r.email,
      city: r.city,
      suspended: r.suspended,
      productsCount: r._count.products,
      salesCount: r._count.sales,
      createdAt: r.createdAt,
    })),
    total,
    page,
    pageSize,
  };
}

export async function setSellerSuspended(
  sellerId: string,
  suspended: boolean,
): Promise<void> {
  const result = await prisma.seller.updateMany({
    where: { id: sellerId },
    data: { suspended },
  });
  if (result.count === 0) throw new Error('Tienda no encontrada.');
}

// ─── API admin (Control Plane) ─────────────────────────────────────────────
//
// Variante para la API admin server-to-server. Expone `phone` y filtro por
// `suspended`, con sort por created_at/shop_name. `totalProducts` cuenta solo
// productos no borrados. Paginación al estilo `listPublicProducts`.

export type AdminSellerApiSortBy = 'created_at' | 'shop_name';
export type AdminApiOrder = 'asc' | 'desc';

export type AdminSellerApiRow = {
  id: string;
  shopName: string;
  email: string;
  phone: string;
  city: string;
  suspended: boolean;
  totalProducts: number;
  createdAt: Date;
};

export type AdminSellerApiPage = {
  items: AdminSellerApiRow[];
  page: number;
  pageSize: number;
  total: number;
  sortBy: AdminSellerApiSortBy;
  order: AdminApiOrder;
};

export type AdminSellerApiFilters = {
  query?: string;
  suspended?: boolean;
  sortBy?: AdminSellerApiSortBy;
  order?: AdminApiOrder;
  page?: number;
  pageSize?: number;
};

export async function listAdminSellers(
  filters: AdminSellerApiFilters,
): Promise<AdminSellerApiPage> {
  const sortBy = filters.sortBy ?? 'created_at';
  const order = filters.order ?? 'desc';
  const pageSize = filters.pageSize ?? 20;
  const requested = Math.max(1, Math.floor(filters.page ?? 1));

  const query = filters.query?.trim();
  const where: Prisma.SellerWhereInput = {
    suspended: filters.suspended,
    OR: query
      ? [
          { shopName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ]
      : undefined,
  };

  const orderBy: Prisma.SellerOrderByWithRelationInput =
    sortBy === 'shop_name' ? { shopName: order } : { createdAt: order };

  const total = await prisma.seller.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, totalPages);
  const offset = (page - 1) * pageSize;

  const rows = await prisma.seller.findMany({
    where,
    orderBy,
    skip: offset,
    take: pageSize,
    select: {
      id: true,
      shopName: true,
      email: true,
      phone: true,
      city: true,
      suspended: true,
      createdAt: true,
      _count: { select: { products: { where: { deletedAt: null } } } },
    },
  });

  return {
    items: rows.map((r) => ({
      id: r.id,
      shopName: r.shopName,
      email: r.email,
      phone: r.phone,
      city: r.city,
      suspended: r.suspended,
      totalProducts: r._count.products,
      createdAt: r.createdAt,
    })),
    page,
    pageSize,
    total,
    sortBy,
    order,
  };
}
