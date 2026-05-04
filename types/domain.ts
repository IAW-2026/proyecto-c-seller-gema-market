// CategoryId es el slug estable usado para visual mapping.
// El DB almacena un ULID en categoria.id; el data layer hace el JOIN
// y expone el slug en Product.category y Category.slug.
export type CategoryId =
  | "living"
  | "dormitorio"
  | "comedor"
  | "cocina"
  | "bath"
  | "terraza"
  | "decoracion";

export type Page<T> = {
  items: ReadonlyArray<T>;
  total: number;
  page: number;
  pageSize: number;
};

export const PAGE_SIZES = [10, 20, 50] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export type Category = {
  id: string;       // ULID en DB; mismo valor que slug en mock
  slug: CategoryId; // slug estable para visual mapping y formularios
  name: string;
};

// ─── Producto ──────────────────────────────────────────────────────────────

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

// ─── Orden / Venta ─────────────────────────────────────────────────────────

// Valores alineados a venta.status del DB.
// El data layer mapea de estos valores al modelo de datos;
// ORDER_STATUS_META en lib/ui-config.ts mapea a etiquetas legibles.
export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "shipping"
  | "delivered"
  | "shipping_failed"
  | "cancelled"
  | "disputed"
  | "refunded";

export type OrderListStatus = OrderStatus | "todos";

// Rangos temporales soportados por el listado de pedidos.
// Las opciones legibles las expone lib/data/orders.ts (ORDER_DATE_RANGE_OPTIONS).
export type OrderDateRange = "7d" | "30d" | "90d" | "all";

export type OrderFilters = {
  status?: OrderListStatus;
  query?: string;
  dateRange?: OrderDateRange;
  page?: number;
  pageSize?: number;
};

// Una Order en el frontend = una venta en el DB.
// Cada venta corresponde a un producto; múltiples ventas pueden
// compartir el mismo order_id del Buyer App.
export type Order = {
  id: string;
  createdAt: string;   // ISO 8601 — fuente: venta.created_at
  date: string;        // derivado: createdAt formateado para UI
  status: OrderStatus;
  productId: string;   // FK → producto.id
  amount: number;      // cantidad de unidades compradas
  total: number;       // monto total cobrado al comprador (ARS)
  fee: number;         // venta.fee — comisión de la plataforma
  buyer: string;       // derivado: nombre del comprador (Buyer App JOIN)
  buyerId: string;     // FK lógica → Buyer App
  address: string;     // derivado: Shipping App
  trackId: string;     // código de tracking (Shipping App)
  paymentId: string;   // FK lógica → Payments App
};

// Información adicional del comprador (fuente: Buyer App).
// Stub hasta implementar la integración inter-app.
export type BuyerInfo = {
  name: string;
  previousPurchases: number;
};

// Información de envío (fuente: Shipping App).
export type ShippingInfo = {
  carrier: string;
  trackingCode: string;
  address: string;
};

// Información de pago (fuente: Payments App).
export type PaymentInfo = {
  method: string;
  statusLabel: string;
  approved: boolean;
};

// ─── Dashboard ─────────────────────────────────────────────────────────────

export type DashboardStatId = "monthlySales" | "orders" | "activeProducts";

export type DashboardStat = {
  id: DashboardStatId;
  value: number;
  delta: number | null;
  trend: "up" | "flat";
};

export type DashboardData = {
  stats: ReadonlyArray<DashboardStat>;
  topProducts: ReadonlyArray<Product>;
  recentOrders: ReadonlyArray<Order>;
};

// ─── Seller ────────────────────────────────────────────────────────────────

export type SellerAddress = {
  street: string;
  number: string;
  apartment?: string;
  postalCode: string;
};

// Forma de entrada para actualizar el perfil del vendedor.
export type SellerInput = {
  name: string;
  city: string;
  bio: string;
  email: string;
  phone: string;
  address: SellerAddress;
};

export type Seller = {
  id: string;
  name: string;
  city: string;
  bio: string;
  email: string;
  phone: string;
  address: SellerAddress;
  productsCount: number; // computado: count(producto) activos
  salesCount: number;    // computado: count(venta)
};
