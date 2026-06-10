// Tipos del contrato HTTP para los endpoints admin de sellers.

export type AdminSellerSortBy = 'created_at' | 'shop_name';
export type AdminOrder = 'asc' | 'desc';

// ─── GET /api/seller/admin/sellers ────────────────────────────────────────────

export type AdminSellerListItem = {
  seller_id: string;
  shop_name: string;
  email: string;
  phone: string;
  city: string;
  suspended: boolean;
  total_products: number;
  created_at: string; // ISO 8601
};

export type AdminSellerListResponse = {
  items: AdminSellerListItem[];
  page: number;
  page_size: number;
  total: number;
  sort_by: AdminSellerSortBy;
  order: AdminOrder;
};

// ─── PATCH /api/seller/admin/sellers/:seller_id ───────────────────────────────

export type AdminSellerSuspendResponse = {
  seller_id: string;
  suspended: boolean;
};
