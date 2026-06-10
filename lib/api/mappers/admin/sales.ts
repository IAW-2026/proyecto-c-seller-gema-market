// Mapper domain → contract HTTP para GET /api/seller/admin/ventas.

import type { AdminSaleApiPage, AdminSaleApiRow } from '@/lib/data/admin/sales';
import type {
  AdminSaleListItem,
  AdminSaleListResponse,
} from '@/lib/api/contracts/admin/sales';

export function toAdminSaleListItem(row: AdminSaleApiRow): AdminSaleListItem {
  return {
    venta_id: row.id,
    order_id: row.orderId,
    product_id: row.productId,
    seller_id: row.sellerId,
    buyer_id: row.buyerId,
    buyer_name: row.buyerName,
    amount: row.amount,
    fee: row.fee,
    status: row.status,
    tracking_code: row.trackingCode,
    created_at: row.createdAt.toISOString(),
  };
}

export function toAdminSaleListResponse(
  page: AdminSaleApiPage,
): AdminSaleListResponse {
  return {
    items: page.items.map(toAdminSaleListItem),
    page: page.page,
    page_size: page.pageSize,
    total: page.total,
    sort_by: page.sortBy,
    order: page.order,
  };
}
