import 'server-only';
import { Prisma, type ProductCondition } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/db';

// Filtros y orden tal como los expone el endpoint público
// `GET /api/seller/productos`. El handler los recibe en snake_case desde la
// URL, los convierte a este shape camelCase, y nosotros traducimos a Prisma.
export type PublicProductSortBy = 'price' | 'created_at' | 'title';
export type PublicProductOrder = 'asc' | 'desc';
export type PublicProductConditionFilter = ProductCondition | 'all';

export type PublicProductFilters = {
  q?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  condition?: PublicProductConditionFilter;
  sortBy?: PublicProductSortBy;
  order?: PublicProductOrder;
  page?: number;
  pageSize?: number;
};

// Row del listing: shape que el handler manda al cliente (sin `href`, que se
// arma desde el request.url — el data layer no conoce URLs).
export type PublicProductRow = {
  product_id: string;
  seller_id: string;
  title: string;
  price: number;
  currency: string;
  category_id: string;
  condition: ProductCondition;
  thumbnail_url: string | null;
};

export type PublicProductPage = {
  items: PublicProductRow[];
  page: number;
  pageSize: number;
  total: number;
  sortBy: PublicProductSortBy;
  order: PublicProductOrder;
};

function buildWhere(filters: PublicProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    // Endpoints públicos: solo productos activos y no borrados.
    status: 'active',
    deletedAt: null,
  };
  if (filters.sellerId) where.sellerId = filters.sellerId;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.condition && filters.condition !== 'all') {
    where.condition = filters.condition;
  }
  const q = filters.q?.trim();
  if (q) where.title = { contains: q, mode: 'insensitive' };
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {
      gte: filters.minPrice,
      lte: filters.maxPrice,
    };
  }
  return where;
}

function buildOrderBy(
  sortBy: PublicProductSortBy,
  order: PublicProductOrder,
): Prisma.ProductOrderByWithRelationInput {
  switch (sortBy) {
    case 'price':
      return { price: order };
    case 'title':
      return { title: order };
    case 'created_at':
      return { createdAt: order };
  }
}

export async function listPublicProducts(
  filters: PublicProductFilters,
): Promise<PublicProductPage> {
  const sortBy = filters.sortBy ?? 'created_at';
  const order = filters.order ?? 'desc';
  const pageSize = filters.pageSize ?? 20;
  const requested = Math.max(1, Math.floor(filters.page ?? 1));

  const where = buildWhere(filters);
  const total = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, totalPages);
  const offset = (page - 1) * pageSize;

  const rows = await prisma.product.findMany({
    where,
    orderBy: buildOrderBy(sortBy, order),
    skip: offset,
    take: pageSize,
    select: {
      id: true,
      sellerId: true,
      title: true,
      price: true,
      currency: true,
      categoryId: true,
      condition: true,
      thumbnailUrl: true,
    },
  });

  return {
    items: rows.map((p) => ({
      product_id: p.id,
      seller_id: p.sellerId,
      title: p.title,
      price: p.price.toNumber(),
      currency: p.currency,
      category_id: p.categoryId,
      condition: p.condition,
      thumbnail_url: p.thumbnailUrl,
    })),
    page,
    pageSize,
    total,
    sortBy,
    order,
  };
}
