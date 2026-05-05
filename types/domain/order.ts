// ─── Orden / Venta ─────────────────────────────────────────────────────────────

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
  sellerId?: string;
  status?: OrderListStatus;
  query?: string;
  dateRange?: OrderDateRange;
  page?: number;
  pageSize?: number;
};

// Una Order en el frontend = una venta en el DB.
// Cada venta corresponde a un producto; múltiples ventas pueden
// compartir el mismo orderId del Buyer App.
export type Order = {
  id: string;          // = venta.id (el ID de esta línea de venta)
  orderId: string;     // = venta.order_id (FK lógica → Buyer App; agrupa ventas del mismo pedido)
  sellerId: string;    // FK → usuario.id (el vendedor dueño de esta venta)
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

// Flujo bajo control del seller: paid → shipping.
// `delivered` lo setea otra app (Shipping) cuando confirma la entrega.
const STATUS_FLOW: Readonly<Partial<Record<OrderStatus, OrderStatus>>> = {
  paid: "shipping",
};

export function nextOrderStatus(current: OrderStatus): OrderStatus | null {
  return STATUS_FLOW[current] ?? null;
}
