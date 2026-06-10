import 'server-only';
import {
  Prisma,
  type ProductCondition,
  type ProductStatus,
} from '@/lib/generated/prisma/client';
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

// ─── API admin (Control Plane / Analytics) ─────────────────────────────────
//
// Variante para la API admin server-to-server. A diferencia de
// `listAllProducts` (UI: filtro por visibility + búsqueda libre), expone el set
// completo de filtros del contrato HTTP y soporta incluir soft-deleted. La
// paginación sigue el patrón de `listPublicProducts` (page_size libre 1..100
// validado por Zod), no el `resolvePageSize` de la UI.

export type AdminProductApiSortBy = 'price' | 'created_at' | 'title' | 'stock';
export type AdminApiOrder = 'asc' | 'desc';

export type AdminProductApiRow = {
  id: string;
  sellerId: string;
  sellerShopName: string;
  title: string;
  thumbnailUrl: string | null;
  price: number;
  currency: string;
  categoryId: string;
  categoryName: string;
  status: ProductStatus;
  condition: ProductCondition;
  stock: number;
  hiddenByAdmin: boolean;
  deletedAt: Date | null;
  createdAt: Date;
};

export type AdminProductApiPage = {
  items: AdminProductApiRow[];
  page: number;
  pageSize: number;
  total: number;
  sortBy: AdminProductApiSortBy;
  order: AdminApiOrder;
};

export type AdminProductApiFilters = {
  query?: string;
  categoryId?: string;
  sellerId?: string;
  status?: ProductStatus;
  condition?: ProductCondition | 'all';
  hidden?: boolean;
  includeDeleted?: boolean;
  minPrice?: number;
  maxPrice?: number;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: AdminProductApiSortBy;
  order?: AdminApiOrder;
  page?: number;
  pageSize?: number;
};

function buildApiWhere(filters: AdminProductApiFilters): Prisma.ProductWhereInput {
  const query = filters.query?.trim();
  const where: Prisma.ProductWhereInput = {
    sellerId: filters.sellerId,
    categoryId: filters.categoryId,
    status: filters.status,
    hiddenByAdmin: filters.hidden,
    // Por defecto solo productos no borrados, salvo include_deleted=true.
    deletedAt: filters.includeDeleted ? undefined : null,
    condition:
      filters.condition && filters.condition !== 'all'
        ? filters.condition
        : undefined,
    title: query ? { contains: query, mode: 'insensitive' } : undefined,
  };
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = { gte: filters.minPrice, lte: filters.maxPrice };
  }
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = { gte: filters.dateFrom, lte: filters.dateTo };
  }
  return where;
}

function buildApiOrderBy(
  sortBy: AdminProductApiSortBy,
  order: AdminApiOrder,
): Prisma.ProductOrderByWithRelationInput {
  switch (sortBy) {
    case 'price':      return { price: order };
    case 'title':      return { title: order };
    case 'stock':      return { stock: order };
    case 'created_at': return { createdAt: order };
  }
}

export async function listAdminProducts(
  filters: AdminProductApiFilters,
): Promise<AdminProductApiPage> {
  const sortBy = filters.sortBy ?? 'created_at';
  const order = filters.order ?? 'desc';
  const pageSize = filters.pageSize ?? 20;
  const requested = Math.max(1, Math.floor(filters.page ?? 1));

  const where = buildApiWhere(filters);
  const total = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, totalPages);
  const offset = (page - 1) * pageSize;

  const rows = await prisma.product.findMany({
    where,
    orderBy: buildApiOrderBy(sortBy, order),
    skip: offset,
    take: pageSize,
    select: {
      id: true,
      sellerId: true,
      title: true,
      thumbnailUrl: true,
      price: true,
      currency: true,
      categoryId: true,
      status: true,
      condition: true,
      stock: true,
      hiddenByAdmin: true,
      deletedAt: true,
      createdAt: true,
      seller: { select: { shopName: true } },
      category: { select: { name: true } },
    },
  });

  return {
    items: rows.map((r) => ({
      id: r.id,
      sellerId: r.sellerId,
      sellerShopName: r.seller.shopName,
      title: r.title,
      thumbnailUrl: r.thumbnailUrl,
      price: r.price.toNumber(),
      currency: r.currency,
      categoryId: r.categoryId,
      categoryName: r.category.name,
      status: r.status,
      condition: r.condition,
      stock: r.stock,
      hiddenByAdmin: r.hiddenByAdmin,
      deletedAt: r.deletedAt,
      createdAt: r.createdAt,
    })),
    page,
    pageSize,
    total,
    sortBy,
    order,
  };
}

export type AdminProductDetail = AdminProductApiRow & {
  description: string;
  weight: number;
  height: number;
  width: number;
  depth: number;
  material: string;
  color: string;
  images: string[];
  updatedAt: Date;
};

// Detalle admin: a diferencia del público, no filtra por status/hidden/deleted
// — el admin ve cualquier producto por id. null si no existe.
export async function getAdminProductDetail(
  productId: string,
): Promise<AdminProductDetail | null> {
  const row = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      sellerId: true,
      title: true,
      description: true,
      weight: true,
      height: true,
      width: true,
      depth: true,
      material: true,
      color: true,
      thumbnailUrl: true,
      images: true,
      price: true,
      currency: true,
      categoryId: true,
      status: true,
      condition: true,
      stock: true,
      hiddenByAdmin: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
      seller: { select: { shopName: true } },
      category: { select: { name: true } },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    sellerId: row.sellerId,
    sellerShopName: row.seller.shopName,
    title: row.title,
    description: row.description,
    weight: row.weight,
    height: row.height,
    width: row.width,
    depth: row.depth,
    material: row.material,
    color: row.color,
    thumbnailUrl: row.thumbnailUrl,
    images: Array.isArray(row.images)
      ? row.images.filter((x): x is string => typeof x === 'string')
      : [],
    price: row.price.toNumber(),
    currency: row.currency,
    categoryId: row.categoryId,
    categoryName: row.category.name,
    status: row.status,
    condition: row.condition,
    stock: row.stock,
    hiddenByAdmin: row.hiddenByAdmin,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// Moderación admin (Control Plane): togglea `hiddenByAdmin` y/o `status`. Los
// campos `undefined` no se tocan (Prisma los ignora en `data`). Devuelve los
// valores resultantes, o null si el producto no existe (→ 404 en el route).
export async function setProductModeration(
  productId: string,
  patch: { hiddenByAdmin?: boolean; status?: ProductStatus },
): Promise<{ id: string; status: ProductStatus; hiddenByAdmin: boolean } | null> {
  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!existing) return null;
  return prisma.product.update({
    where: { id: productId },
    data: { hiddenByAdmin: patch.hiddenByAdmin, status: patch.status },
    select: { id: true, status: true, hiddenByAdmin: true },
  });
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
