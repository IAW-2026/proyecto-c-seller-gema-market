// Tipos del contrato HTTP para GET /api/seller/admin/stats.

export type AdminStatsTopCategory = {
  category_id: string;
  name: string;
  count: number;
};

export type AdminStatsTopSeller = {
  seller_id: string;
  shop_name: string;
  revenue: number;
};

export type AdminStatsResponse = {
  total_products: number;
  products_by_status: { active: number; paused: number };
  hidden_products: number;
  total_sales: number;
  total_revenue: number;
  currency: string;
  top_categories: AdminStatsTopCategory[];
  top_sellers: AdminStatsTopSeller[];
};
