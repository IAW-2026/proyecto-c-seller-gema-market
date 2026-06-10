// Mapper domain → contract HTTP para GET /api/seller/admin/sellers.

import type {
  AdminSellerApiPage,
  AdminSellerApiRow,
} from '@/lib/data/admin/sellers';
import type {
  AdminSellerListItem,
  AdminSellerListResponse,
} from '@/lib/api/contracts/admin/sellers';

export function toAdminSellerListItem(
  row: AdminSellerApiRow,
): AdminSellerListItem {
  return {
    seller_id: row.id,
    shop_name: row.shopName,
    email: row.email,
    phone: row.phone,
    city: row.city,
    suspended: row.suspended,
    total_products: row.totalProducts,
    created_at: row.createdAt.toISOString(),
  };
}

export function toAdminSellerListResponse(
  page: AdminSellerApiPage,
): AdminSellerListResponse {
  return {
    items: page.items.map(toAdminSellerListItem),
    page: page.page,
    page_size: page.pageSize,
    total: page.total,
    sort_by: page.sortBy,
    order: page.order,
  };
}
