import 'server-only';
import { Prisma, type ProductCondition } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/db';

// Tipos de dominio (camelCase). No conocen el shape del contrato HTTP — esa
// traducción la hacen los mappers en `lib/api/mappers/products.ts`.

export type ProductSortBy = 'price' | 'created_at' | 'title';
export type ProductOrder = 'asc' | 'desc';
export type ProductConditionFilter = ProductCondition | 'all';

export type PublicProductFilters = {
  q?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  condition?: ProductConditionFilter;
  sortBy?: ProductSortBy;
  order?: ProductOrder;
  page?: number;
  pageSize?: number;
};

// Row de listing: solo lo que el listado público necesita. No incluye joins
// pesados — el detalle (con seller y category enriquecidos) tiene su propio
// tipo más abajo.
export type PublicProductListItem = {
  productId: string;
  sellerId: string;
  title: string;
  price: number;
  currency: string;
  categoryId: string;
  condition: ProductCondition;
  thumbnailUrl: string | null;
};

export type PublicProductPage = {
  items: PublicProductListItem[];
  page: number;
  pageSize: number;
  total: number;
  sortBy: ProductSortBy;
  order: ProductOrder;
};

export type PublicProductDetail = {
  productId: string;
  sellerId: string;
  sellerShopName: string;
  sellerLogoUrl: string | null;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  weight: number;
  height: number;
  width: number;
  depth: number;
  material: string;
  color: string;
  price: number;
  currency: string;
  stock: number;
  condition: ProductCondition;
  thumbnailUrl: string | null;
  galleryImages: string[];
  createdAt: Date;
};

// Shape para el batch endpoint: subconjunto del detalle, sin description,
// galería, material/color ni createdAt — pensado para carrito/favoritos.
export type PublicProductBatchItem = {
  productId: string;
  sellerId: string;
  sellerShopName: string;
  sellerLogoUrl: string | null;
  title: string;
  categoryId: string;
  price: number;
  currency: string;
  stock: number;
  condition: ProductCondition;
  thumbnailUrl: string | null;
  weight: number;
  height: number;
  width: number;
  depth: number;
};

function buildWhere(filters: PublicProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    // Endpoints públicos: solo productos activos, no borrados, no ocultados por
    // un admin y cuyo seller no esté suspendido.
    status: 'active',
    deletedAt: null,
    hiddenByAdmin: false,
    seller: { suspended: false },
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
  sortBy: ProductSortBy,
  order: ProductOrder,
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
      productId: p.id,
      sellerId: p.sellerId,
      title: p.title,
      price: p.price.toNumber(),
      currency: p.currency,
      categoryId: p.categoryId,
      condition: p.condition,
      thumbnailUrl: p.thumbnailUrl,
    })),
    page,
    pageSize,
    total,
    sortBy,
    order,
  };
}

export async function findPublicProduct(
  productId: string,
): Promise<PublicProductDetail | null> {
  const row = await prisma.product.findFirst({
    where: {
      id: productId,
      status: 'active',
      deletedAt: null,
      hiddenByAdmin: false,
      seller: { suspended: false },
    },
    select: {
      id: true,
      title: true,
      description: true,
      weight: true,
      height: true,
      width: true,
      depth: true,
      condition: true,
      material: true,
      color: true,
      price: true,
      currency: true,
      categoryId: true,
      stock: true,
      thumbnailUrl: true,
      images: true,
      createdAt: true,
      category: { select: { name: true } },
      seller: { select: { id: true, shopName: true, logoUrl: true } },
    },
  });
  if (!row) return null;

  const galleryImages = Array.isArray(row.images)
    ? row.images.filter((u): u is string => typeof u === 'string')
    : [];

  return {
    productId: row.id,
    sellerId: row.seller.id,
    sellerShopName: row.seller.shopName,
    sellerLogoUrl: row.seller.logoUrl,
    title: row.title,
    description: row.description,
    categoryId: row.categoryId,
    categoryName: row.category.name,
    weight: row.weight,
    height: row.height,
    width: row.width,
    depth: row.depth,
    material: row.material,
    color: row.color,
    price: row.price.toNumber(),
    currency: row.currency,
    stock: row.stock,
    condition: row.condition,
    thumbnailUrl: row.thumbnailUrl,
    galleryImages,
    createdAt: row.createdAt,
  };
}

// Lookup batch: devuelve los productos públicos que matchean los IDs dados,
// preservando el orden de entrada. IDs sin match (inexistentes, paused o
// soft-deleted) se omiten silenciosamente — el consumer (carrito) sigue
// renderizando los demás items.
export async function findPublicProductsByIds(
  ids: ReadonlyArray<string>,
): Promise<PublicProductBatchItem[]> {
  if (ids.length === 0) return [];

  const rows = await prisma.product.findMany({
    where: {
      id: { in: [...ids] },
      status: 'active',
      deletedAt: null,
      hiddenByAdmin: false,
      seller: { suspended: false },
    },
    select: {
      id: true,
      sellerId: true,
      title: true,
      categoryId: true,
      price: true,
      currency: true,
      stock: true,
      condition: true,
      thumbnailUrl: true,
      weight: true,
      height: true,
      width: true,
      depth: true,
      seller: { select: { shopName: true, logoUrl: true } },
    },
  });

  const byId = new Map(
    rows.map((row) => [
      row.id,
      {
        productId: row.id,
        sellerId: row.sellerId,
        sellerShopName: row.seller.shopName,
        sellerLogoUrl: row.seller.logoUrl,
        title: row.title,
        categoryId: row.categoryId,
        price: row.price.toNumber(),
        currency: row.currency,
        stock: row.stock,
        condition: row.condition,
        thumbnailUrl: row.thumbnailUrl,
        weight: row.weight,
        height: row.height,
        width: row.width,
        depth: row.depth,
      } satisfies PublicProductBatchItem,
    ]),
  );

  return ids.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
}
