import type {
  PublicShop,
  PublicShopProductItem,
} from '@/lib/data/public-shop';
import type { ShopProductItem, ShopResponse } from '@/lib/api/contracts/shops';

function shopProductHref(origin: string, productId: string): string {
  return `${origin}/api/seller/productos/${productId}`;
}

function toShopProductItem(
  domain: PublicShopProductItem,
  origin: string,
): ShopProductItem {
  return {
    product_id: domain.productId,
    title: domain.title,
    price: domain.price,
    currency: domain.currency,
    category_id: domain.categoryId,
    condition: domain.condition,
    thumbnail_url: domain.thumbnailUrl,
    href: shopProductHref(origin, domain.productId),
  };
}

export function toShopResponse(
  domain: PublicShop,
  origin: string,
): ShopResponse {
  return {
    seller_id: domain.sellerId,
    shop_name: domain.shopName,
    bio: domain.bio,
    logo_url: domain.logoUrl,
    cover_url: domain.coverUrl,
    city: domain.city,
    total_products: domain.totalProducts,
    categories: domain.categories.map((c) => ({
      category_id: c.categoryId,
      name: c.name,
    })),
    products: {
      items: domain.products.items.map((p) => toShopProductItem(p, origin)),
      page: domain.products.page,
      page_size: domain.products.pageSize,
      total: domain.products.total,
    },
  };
}
