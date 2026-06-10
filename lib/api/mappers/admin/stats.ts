// Mapper domain → contract HTTP para GET /api/seller/admin/stats.

import type { AdminStats } from '@/lib/data/admin/stats';
import type { AdminStatsResponse } from '@/lib/api/contracts/admin/stats';

export function toAdminStatsResponse(stats: AdminStats): AdminStatsResponse {
  return {
    total_products: stats.totalProducts,
    products_by_status: stats.productsByStatus,
    hidden_products: stats.hiddenProducts,
    total_sales: stats.totalSales,
    total_revenue: stats.totalRevenue,
    currency: stats.currency,
    top_categories: stats.topCategories.map((c) => ({
      category_id: c.categoryId,
      name: c.name,
      count: c.count,
    })),
    top_sellers: stats.topSellers.map((s) => ({
      seller_id: s.sellerId,
      shop_name: s.shopName,
      revenue: s.revenue,
    })),
  };
}
