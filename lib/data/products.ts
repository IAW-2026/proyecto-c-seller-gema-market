import 'server-only';
import { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/db';
import { newId, PREFIXES } from '@/lib/ids';
import type {
  Page,
  PageSize,
  ProductFilters,
  ProductInput,
  ProductStatus,
  ProductWithJoins,
  SortBy,
  StockSummary,
} from '@/types/domain';
import { PAGE_SIZES } from '@/types/domain';

export const DEFAULT_PRODUCTS_PAGE_SIZE: PageSize = 10;

const productSelect = {
  id: true,
  sellerId: true,
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
  status: true,
  images: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { name: true } },
  seller: { select: { shopName: true } },
  _count: { select: { sales: true } },
} satisfies Prisma.ProductSelect;

type ProductRow = Prisma.ProductGetPayload<{ select: typeof productSelect }>;

function toProductWithJoins(row: ProductRow): ProductWithJoins {
  const { seller, category, _count, price, images, ...rest } = row;
  return {
    ...rest,
    price: price.toNumber(),
    images: Array.isArray(images)
      ? images.filter((x): x is string => typeof x === 'string')
      : [],
    sellerShopName: seller.shopName,
    categoryName: category.name,
    salesCount: _count.sales,
  };
}

function buildWhere(filters: ProductFilters): Prisma.ProductWhereInput {
  const query = filters.query?.trim();
  return {
    sellerId: filters.sellerId,
    status: filters.status,
    title: query ? { contains: query, mode: 'insensitive' } : undefined,
    stock:
      filters.stockFilter === 'low'
        ? { gt: 0, lt: 5 }
        : filters.stockFilter === 'out'
          ? 0
          : undefined,
  };
}

function buildOrderBy(
  sortBy: SortBy | undefined,
): Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] {
  switch (sortBy) {
    case 'price_asc':  return { price: 'asc' };
    case 'price_desc': return { price: 'desc' };
    case 'sales_asc':  return { sales: { _count: 'asc' } };
    case 'sales_desc': return { sales: { _count: 'desc' } };
    case 'stock_asc':  return { stock: 'asc' };
    case 'stock_desc': return { stock: 'desc' };
    default:           return { createdAt: 'desc' };
  }
}

function resolvePageSize(value: number | undefined, fallback: PageSize): PageSize {
  return (PAGE_SIZES as ReadonlyArray<number>).includes(value ?? -1)
    ? (value as PageSize)
    : fallback;
}

export async function listProducts(
  filters: ProductFilters = {},
): Promise<Page<ProductWithJoins>> {
  const where = buildWhere(filters);
  const pageSize = resolvePageSize(filters.pageSize, DEFAULT_PRODUCTS_PAGE_SIZE);
  const requested = Math.max(1, Math.floor(filters.page ?? 1));
  const total = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, totalPages);
  const offset = (page - 1) * pageSize;
  const rows = await prisma.product.findMany({
    where,
    orderBy: buildOrderBy(filters.sortBy),
    skip: offset,
    take: pageSize,
    select: productSelect,
  });
  return { items: rows.map(toProductWithJoins), total, page, pageSize };
}

export async function countProductsByStatus(
  sellerId?: string,
): Promise<Record<ProductStatus, number>> {
  const groups = await prisma.product.groupBy({
    by: ['status'],
    where: sellerId ? { sellerId } : undefined,
    _count: { _all: true },
  });
  const out: Record<ProductStatus, number> = { active: 0, paused: 0 };
  for (const g of groups) {
    out[g.status] = g._count._all;
  }
  return out;
}

export async function getStockSummary(sellerId?: string): Promise<StockSummary> {
  const where: Prisma.ProductWhereInput = sellerId ? { sellerId } : {};
  const [agg, activeSkus, outOfStock] = await Promise.all([
    prisma.product.aggregate({ where, _sum: { stock: true } }),
    prisma.product.count({ where: { ...where, status: 'active' } }),
    prisma.product.count({ where: { ...where, stock: 0 } }),
  ]);
  return {
    totalUnits: agg._sum.stock ?? 0,
    activeSkus,
    outOfStock,
  };
}

export async function getTopProducts(
  limit: number,
  sellerId?: string,
): Promise<ReadonlyArray<ProductWithJoins>> {
  const rows = await prisma.product.findMany({
    where: sellerId ? { sellerId } : undefined,
    orderBy: { sales: { _count: 'desc' } },
    take: limit,
    select: productSelect,
  });
  return rows.map(toProductWithJoins);
}

// Lookup scopeado al seller dueño. Es la única forma de leer un producto
// en el panel: nunca queremos exponer detalles de un producto ajeno por
// adivinar su `id` en la URL.
export async function findOwnedProduct(
  id: string,
  sellerId: string,
): Promise<ProductWithJoins | null> {
  const row = await prisma.product.findFirst({
    where: { id, sellerId },
    select: productSelect,
  });
  return row ? toProductWithJoins(row) : null;
}

export async function saveProduct(
  sellerId: string,
  input: ProductInput,
): Promise<ProductWithJoins> {
  const data = {
    title: input.title,
    description: input.description,
    weight: input.weight,
    height: input.height,
    width: input.width,
    depth: input.depth,
    condition: input.condition,
    material: input.material,
    color: input.color,
    price: new Prisma.Decimal(input.price),
    currency: input.currency,
    categoryId: input.categoryId,
    stock: input.stock,
    status: input.status,
    images: [...input.images],
  };
  if (input.id) {
    // Verificamos ownership antes de tocar el row. `sellerId` no entra al
    // `data` — un seller no puede reasignarse productos ajenos.
    const owned = await prisma.product.findFirst({
      where: { id: input.id, sellerId },
      select: { id: true },
    });
    if (!owned) throw new Error("Producto no encontrado.");
    const row = await prisma.product.update({
      where: { id: input.id },
      data,
      select: productSelect,
    });
    return toProductWithJoins(row);
  }
  const row = await prisma.product.create({
    data: { id: newId(PREFIXES.product), sellerId, ...data },
    select: productSelect,
  });
  return toProductWithJoins(row);
}

export async function updateProductStock(
  productId: string,
  sellerId: string,
  stock: number,
): Promise<void> {
  // `updateMany` con filtro por `sellerId` evita modificar stock ajeno: si el
  // producto no es del seller, `count` queda en 0 y tiramos error.
  const result = await prisma.product.updateMany({
    where: { id: productId, sellerId },
    data: { stock },
  });
  if (result.count === 0) {
    throw new Error("Producto no encontrado.");
  }
}

export async function uploadProductImage(file: File): Promise<string> {
  // TODO (Fase 3): subir el archivo a Vercel Blob y devolver la URL pública.
  void file;
  throw new Error('uploadProductImage: storage no configurado todavía');
}
