// ─── Producto ──────────────────────────────────────────────────────────────
//
// Refleja prisma `Product` 1:1. Los joins (sellerShopName, categoryName) y
// agregaciones (salesCount) viven en `ProductWithJoins`.

export type ProductCondition = "nuevo" | "usado";
export type ProductStatus = "active" | "paused";

export type Product = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  weight: number; // kg
  height: number; // cm
  width: number;  // cm
  depth: number;  // cm
  condition: ProductCondition;
  material: string;
  color: string;
  price: number;
  currency: string; // ISO 4217 (ARS por default)
  categoryId: string;
  stock: number;
  status: ProductStatus;
  images: ReadonlyArray<string>;
  createdAt: Date;
  updatedAt: Date;
};

// Vista enriquecida con joins/agregaciones que el data layer compone.
export type ProductWithJoins = Product & {
  sellerShopName: string; // Seller.shopName
  categoryName: string;   // Categoria.name
  salesCount: number;     // count(Sale)
};

// Forma de entrada para crear/editar un producto.
// El data layer es el único que convierte esto a una query de DB.
export type ProductInput = {
  id?: string; // presente en edición, ausente en creación
  title: string;
  description: string;
  price: number;
  currency: string;
  categoryId: string;
  stock: number;
  weight: number;
  height: number;
  width: number;
  depth: number;
  material: string;
  color: string;
  condition: ProductCondition;
  images: ReadonlyArray<string>;
  status: ProductStatus;
};

export type SortBy =
  | "price_asc"
  | "price_desc"
  | "sales_asc"
  | "sales_desc"
  | "stock_asc"
  | "stock_desc";

export type StockFilter = "all" | "low" | "out";

export type ProductFilters = {
  sellerId?: string;
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
