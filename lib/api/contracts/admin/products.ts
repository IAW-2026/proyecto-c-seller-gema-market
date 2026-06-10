// Tipos del contrato HTTP para los endpoints admin de productos.
// Snake_case: así viaja el JSON. El data layer trabaja en camelCase y los
// mappers en `lib/api/mappers/admin/` traducen entre ambos mundos.

import type { ProductCondition } from '@/lib/api/contracts/products';

export type ProductStatus = 'active' | 'paused';
export type AdminProductSortBy = 'price' | 'created_at' | 'title' | 'stock';
export type AdminOrder = 'asc' | 'desc';

// ─── GET /api/seller/admin/productos ──────────────────────────────────────────

export type AdminProductListItem = {
  product_id: string;
  seller_id: string;
  seller_name: string;
  title: string;
  thumbnail_url: string | null;
  price: number;
  currency: string;
  category_id: string;
  category_name: string;
  status: ProductStatus;
  condition: ProductCondition;
  stock: number;
  hidden_by_admin: boolean;
  deleted_at: string | null; // ISO 8601
  created_at: string; // ISO 8601
};

export type AdminProductListResponse = {
  items: AdminProductListItem[];
  page: number;
  page_size: number;
  total: number;
  sort_by: AdminProductSortBy;
  order: AdminOrder;
};

// ─── GET /api/seller/admin/productos/:product_id ──────────────────────────────

export type AdminProductDetailResponse = AdminProductListItem & {
  description: string;
  weight: number;
  height: number;
  width: number;
  depth: number;
  material: string;
  color: string;
  images: string[];
  updated_at: string; // ISO 8601
};

// ─── PATCH /api/seller/admin/productos/:product_id ────────────────────────────

export type AdminProductModerationResponse = {
  product_id: string;
  status: ProductStatus;
  hidden_by_admin: boolean;
};
