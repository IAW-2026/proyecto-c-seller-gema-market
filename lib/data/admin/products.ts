import 'server-only';
import { Prisma, type ProductStatus } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/db';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  type Page,
  type PageSize,
} from '@/types/domain';

// Vista global de productos para moderación del admin. Incluye `hiddenByAdmin`
// y el nombre del seller — datos que la capa del seller no expone. No filtra por
// `hiddenByAdmin` (el admin necesita ver y togglear ambos). Excluye soft-deleted.

export type AdminVisibility = 'all' | 'visible' | 'hidden';

export type AdminProductRow = {
  id: string;
  title: string;
  sellerId: string;
  sellerShopName: string;
  price: number;
  currency: string;
  stock: number;
  status: ProductStatus;
  hiddenByAdmin: boolean;
  categoryName: string;
  thumbnailUrl: string | null;
  createdAt: Date;
};

export type AdminProductFilters = {
  query?: string;
  visibility?: AdminVisibility;
  page?: number;
  pageSize?: number;
};

function resolvePageSize(value: number | undefined): PageSize {
  return (PAGE_SIZES as ReadonlyArray<number>).includes(value ?? -1)
    ? (value as PageSize)
    : DEFAULT_PAGE_SIZE;
}

function buildWhere(filters: AdminProductFilters): Prisma.ProductWhereInput {
  const query = filters.query?.trim();
  return {
    deletedAt: null,
    hiddenByAdmin:
      filters.visibility === 'hidden'
        ? true
        : filters.visibility === 'visible'
          ? false
          : undefined,
    OR: query
      ? [
          { title: { contains: query, mode: 'insensitive' } },
          { seller: { shopName: { contains: query, mode: 'insensitive' } } },
        ]
      : undefined,
  };
}

export async function listAllProducts(
  filters: AdminProductFilters = {},
): Promise<Page<AdminProductRow>> {
  const where = buildWhere(filters);
  const pageSize = resolvePageSize(filters.pageSize);
  const requested = Math.max(1, Math.floor(filters.page ?? 1));
  const total = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, totalPages);
  const offset = (page - 1) * pageSize;

  const rows = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: pageSize,
    select: {
      id: true,
      title: true,
      sellerId: true,
      price: true,
      currency: true,
      stock: true,
      status: true,
      hiddenByAdmin: true,
      thumbnailUrl: true,
      createdAt: true,
      seller: { select: { shopName: true } },
      category: { select: { name: true } },
    },
  });

  return {
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      sellerId: r.sellerId,
      sellerShopName: r.seller.shopName,
      price: r.price.toNumber(),
      currency: r.currency,
      stock: r.stock,
      status: r.status,
      hiddenByAdmin: r.hiddenByAdmin,
      categoryName: r.category.name,
      thumbnailUrl: r.thumbnailUrl,
      createdAt: r.createdAt,
    })),
    total,
    page,
    pageSize,
  };
}

// Togglea la visibilidad de un producto. Devuelve el `sellerId` dueño para que
// la action invalide los caches del seller afectado.
export async function setProductHidden(
  productId: string,
  hidden: boolean,
): Promise<{ sellerId: string }> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sellerId: true },
  });
  if (!product) throw new Error('Producto no encontrado.');
  await prisma.product.update({
    where: { id: productId },
    data: { hiddenByAdmin: hidden },
  });
  return { sellerId: product.sellerId };
}
