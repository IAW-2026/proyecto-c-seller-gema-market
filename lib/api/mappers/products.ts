// Mappers domain → contract HTTP para productos. Funciones puras, sin IO.
// Acá vive la traducción camelCase → snake_case y la composición de `href`,
// `images` (thumbnail + galería), `created_at` como ISO, etc.

import type {
  PublicProductDetail,
  PublicProductListItem,
  PublicProductPage,
} from '@/lib/data/public-products';
import type {
  ProductDetailResponse,
  ProductListItem,
  ProductListResponse,
} from '@/lib/api/contracts/products';

function productHref(origin: string, productId: string): string {
  return `${origin}/api/seller/productos/${productId}`;
}

export function toProductListItem(
  domain: PublicProductListItem,
  origin: string,
): ProductListItem {
  return {
    product_id: domain.productId,
    seller_id: domain.sellerId,
    title: domain.title,
    price: domain.price,
    currency: domain.currency,
    category_id: domain.categoryId,
    condition: domain.condition,
    thumbnail_url: domain.thumbnailUrl,
    href: productHref(origin, domain.productId),
  };
}

export function toProductListResponse(
  page: PublicProductPage,
  origin: string,
): ProductListResponse {
  return {
    items: page.items.map((item) => toProductListItem(item, origin)),
    page: page.page,
    page_size: page.pageSize,
    total: page.total,
    sort_by: page.sortBy,
    order: page.order,
  };
}

export function toProductDetailResponse(
  domain: PublicProductDetail,
): ProductDetailResponse {
  // El contrato pone images[0] = thumbnail y el resto la galería. Si no hay
  // thumbnail (caso edge), devolvemos solo la galería.
  const images = domain.thumbnailUrl
    ? [domain.thumbnailUrl, ...domain.galleryImages]
    : domain.galleryImages;

  return {
    product_id: domain.productId,
    seller: {
      seller_id: domain.sellerId,
      shop_name: domain.sellerShopName,
      logo_url: domain.sellerLogoUrl,
    },
    title: domain.title,
    description: domain.description,
    category_id: domain.categoryId,
    category_name: domain.categoryName,
    weight: domain.weight,
    height: domain.height,
    width: domain.width,
    depth: domain.depth,
    material: domain.material,
    color: domain.color,
    price: domain.price,
    currency: domain.currency,
    stock: domain.stock,
    condition: domain.condition,
    images,
    created_at: domain.createdAt.toISOString(),
  };
}
