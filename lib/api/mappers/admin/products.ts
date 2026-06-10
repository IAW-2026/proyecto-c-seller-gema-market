// Mappers domain → contract HTTP para los endpoints admin de productos.
// Funciones puras: camelCase → snake_case, Decimal ya viene como Number desde
// el data layer, fechas → ISO.

import type {
  AdminProductApiPage,
  AdminProductApiRow,
  AdminProductDetail,
} from '@/lib/data/admin/products';
import type {
  AdminProductDetailResponse,
  AdminProductListItem,
  AdminProductListResponse,
} from '@/lib/api/contracts/admin/products';

export function toAdminProductListItem(
  row: AdminProductApiRow,
): AdminProductListItem {
  return {
    product_id: row.id,
    seller_id: row.sellerId,
    seller_name: row.sellerShopName,
    title: row.title,
    thumbnail_url: row.thumbnailUrl,
    price: row.price,
    currency: row.currency,
    category_id: row.categoryId,
    category_name: row.categoryName,
    status: row.status,
    condition: row.condition,
    stock: row.stock,
    hidden_by_admin: row.hiddenByAdmin,
    deleted_at: row.deletedAt ? row.deletedAt.toISOString() : null,
    created_at: row.createdAt.toISOString(),
  };
}

export function toAdminProductListResponse(
  page: AdminProductApiPage,
): AdminProductListResponse {
  return {
    items: page.items.map(toAdminProductListItem),
    page: page.page,
    page_size: page.pageSize,
    total: page.total,
    sort_by: page.sortBy,
    order: page.order,
  };
}

export function toAdminProductDetailResponse(
  detail: AdminProductDetail,
): AdminProductDetailResponse {
  return {
    ...toAdminProductListItem(detail),
    description: detail.description,
    weight: detail.weight,
    height: detail.height,
    width: detail.width,
    depth: detail.depth,
    material: detail.material,
    color: detail.color,
    images: detail.images,
    updated_at: detail.updatedAt.toISOString(),
  };
}
