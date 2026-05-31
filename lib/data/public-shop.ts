import 'server-only';
import { type ProductCondition } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/db';

// Dominio del shop público (camelCase). Compone seller + categorías que usa +
// productos paginados, todo scopeado a `status=active` y `deletedAt: null`.

export type PublicShopCategory = {
  categoryId: string;
  name: string;
};

export type PublicShopProductItem = {
  productId: string;
  title: string;
  price: number;
  currency: string;
  categoryId: string;
  condition: ProductCondition;
  thumbnailUrl: string | null;
};

export type PublicShopProductsPage = {
  items: PublicShopProductItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type PublicShop = {
  sellerId: string;
  shopName: string;
  bio: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  city: string;
  totalProducts: number;
  categories: PublicShopCategory[];
  products: PublicShopProductsPage;
};

export type FindPublicShopOptions = {
  page?: number;
  pageSize?: number;
};

export async function findPublicShop(
  sellerId: string,
  opts: FindPublicShopOptions = {},
): Promise<PublicShop | null> {
  // Un seller suspendido por un admin no tiene shop público: el endpoint
  // responde 404 igual que para un id inexistente.
  const seller = await prisma.seller.findFirst({
    where: { id: sellerId, suspended: false },
    select: {
      id: true,
      shopName: true,
      bio: true,
      logoUrl: true,
      coverUrl: true,
      city: true,
    },
  });
  if (!seller) return null;

  const activeProductsWhere = {
    sellerId,
    status: 'active' as const,
    deletedAt: null,
    hiddenByAdmin: false,
  };

  const totalProducts = await prisma.product.count({ where: activeProductsWhere });

  // Categorías distinct en las que el seller publica productos activos.
  // Ordenadas por nombre para que el orden sea estable entre requests.
  const categoryRows = await prisma.product.findMany({
    where: activeProductsWhere,
    distinct: ['categoryId'],
    orderBy: { category: { name: 'asc' } },
    select: {
      categoryId: true,
      category: { select: { name: true } },
    },
  });

  const pageSize = opts.pageSize ?? 20;
  const requested = Math.max(1, Math.floor(opts.page ?? 1));
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
  const page = Math.min(requested, totalPages);
  const offset = (page - 1) * pageSize;

  const productRows = await prisma.product.findMany({
    where: activeProductsWhere,
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: pageSize,
    select: {
      id: true,
      title: true,
      price: true,
      currency: true,
      categoryId: true,
      condition: true,
      thumbnailUrl: true,
    },
  });

  return {
    sellerId: seller.id,
    shopName: seller.shopName,
    bio: seller.bio,
    logoUrl: seller.logoUrl,
    coverUrl: seller.coverUrl,
    city: seller.city,
    totalProducts,
    categories: categoryRows.map((row) => ({
      categoryId: row.categoryId,
      name: row.category.name,
    })),
    products: {
      items: productRows.map((p) => ({
        productId: p.id,
        title: p.title,
        price: p.price.toNumber(),
        currency: p.currency,
        categoryId: p.categoryId,
        condition: p.condition,
        thumbnailUrl: p.thumbnailUrl,
      })),
      page,
      pageSize,
      total: totalProducts,
    },
  };
}
