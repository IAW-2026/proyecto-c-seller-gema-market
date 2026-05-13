// Tipos del contrato HTTP para los endpoints públicos de productos.
//
// Son la **single source of truth** del shape que la API expone hacia afuera:
// se usan en los route handlers (response bodies) y en los tests (parseo de
// respuestas con tipo). Cualquier divergencia entre estos tipos y
// `docs/apis.md` es un bug del contrato.
//
// Snake_case porque así viaja el JSON. El data layer trabaja en camelCase y
// los mappers en `lib/api/mappers/` traducen entre ambos mundos.

export type ProductCondition = 'nuevo' | 'usado';
export type ProductSortBy = 'price' | 'created_at' | 'title';
export type ProductOrder = 'asc' | 'desc';
export type ProductConditionFilter = ProductCondition | 'all';

// ─── GET /api/seller/productos ────────────────────────────────────────────────

export type ProductListItem = {
  product_id: string;
  seller_id: string;
  title: string;
  price: number;
  currency: string;
  category_id: string;
  condition: ProductCondition;
  thumbnail_url: string | null;
  href: string;
};

export type ProductListResponse = {
  items: ProductListItem[];
  page: number;
  page_size: number;
  total: number;
  sort_by: ProductSortBy;
  order: ProductOrder;
};

// ─── GET /api/seller/productos/:product_id ────────────────────────────────────

export type ProductSellerSummary = {
  seller_id: string;
  shop_name: string;
  logo_url: string | null;
};

export type ProductDetailResponse = {
  product_id: string;
  seller: ProductSellerSummary;
  title: string;
  description: string;
  category_id: string;
  category_name: string;
  weight: number;
  height: number;
  width: number;
  depth: number;
  material: string;
  color: string;
  price: number;
  currency: string;
  stock: number;
  condition: ProductCondition;
  // [thumbnailUrl, ...gallery]. Si no hay thumbnail, solo la galería.
  images: string[];
  created_at: string; // ISO 8601
};
