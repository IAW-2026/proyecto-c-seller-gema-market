// ─── Orden / Venta ─────────────────────────────────────────────────────────
//
// Una `Order` en el frontend = un registro de prisma `Sale` (una línea de
// venta). Múltiples ventas pueden compartir el mismo `orderId` del Buyer App.
// El filtro por rango de fechas opera sobre `createdAt`.

// Valores alineados a `SaleStatus` del schema y al modelo de datos.
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
  sellerId?: string;
  status?: OrderListStatus;
  query?: string;
  dateRange?: OrderDateRange;
  page?: number;
  pageSize?: number;
};

export type Order = {
  id: string;          // Sale.id
  orderId: string;     // FK lógica → Buyer App (agrupa ventas del mismo pedido)
  productId: string;   // FK → Product.id
  sellerId: string;    // FK → Seller.id
  buyerId: string;     // FK lógica → Buyer App
  paymentId: string;   // FK lógica → Payments App
  amount: number;      // cantidad de unidades compradas
  total: number;       // monto total cobrado al comprador
  fee: number;         // comisión de la plataforma
  status: OrderStatus;
  createdAt: string;   // ISO 8601 (también la fuente para filtros por fecha)
  updatedAt: string;   // ISO 8601
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

// Vista de detalle: la venta + datos cross-app traídos por el data layer.
export type OrderDetailView = Order & {
  buyer?: BuyerInfo;
  shipping?: ShippingInfo;
  payment?: PaymentInfo;
};

// Flujo bajo control del seller: paid → shipping.
// `delivered` lo setea otra app (Shipping) cuando confirma la entrega.
const STATUS_FLOW: Readonly<Partial<Record<OrderStatus, OrderStatus>>> = {
  paid: "shipping",
};

export function nextOrderStatus(current: OrderStatus): OrderStatus | null {
  return STATUS_FLOW[current] ?? null;
}
