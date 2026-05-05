// ─── Producto ──────────────────────────────────────────────────────────────

import type { CategoryId } from "./catalog";

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  seller: string;      // derivado: usuario.shop_name via JOIN
  sellerId: string;
  category: CategoryId; // derivado: categoria.slug via JOIN
  stock: number;
  salesCount: number;  // computado: count(venta) donde product_id = id
  weight: number;      // kg
  height: number;      // cm
  width: number;       // cm
  depth: number;       // cm
  material: string;
  color: string;
  condition: string;              // ej: "Nuevo", "Usado · Como nuevo"
  images: ReadonlyArray<string>; // URLs — producto.images (JSON)
  status: ProductStatus;
};

// Forma de entrada para crear/editar un producto.
// El data layer es el único que convierte esto a una query de DB.
export type ProductInput = {
  id?: string;         // presente en edición, ausente en creación
  title: string;
  description: string;
  price: number;
  category: CategoryId;
  stock: number;
  weight: number;
  height: number;
  width: number;
  depth: number;
  material: string;
  color: string;
  condition: string;
  images: ReadonlyArray<string>;
  status: ProductStatus;
};

export type ProductStatus = "active" | "paused";

export type SortBy =
  | "price_asc"
  | "price_desc"
  | "sales_asc"
  | "sales_desc"
  | "stock_asc"
  | "stock_desc";

export type StockFilter = "all" | "low" | "out";

export type ProductFilters = {
  query?: string;
  status?: ProductStatus;
  sortBy?: SortBy;
  stockFilter?: StockFilter;
  page?: number;
  pageSize?: number;
};

export type StockSummary = {
  totalUnits: number;
  activeSkus: number;
  outOfStock: number;
};
