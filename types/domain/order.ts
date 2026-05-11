// ─── Orden / Venta ─────────────────────────────────────────────────────────
//
// Una `Order` en el frontend = un registro de prisma `Sale` (una línea de
// venta). Múltiples ventas pueden compartir el mismo `orderId` del Buyer App.
// El filtro por rango de fechas opera sobre `createdAt`.

// Valores alineados a `SaleStatus` del schema y al modelo de datos.
// La venta nace en `paid` (el pago ya está aprobado cuando llega a esta app),
// avanza a `shipping` por acción del seller, y termina en `delivered`
// o `shipping_failed` (ambos seteados por Shipping App).
export type OrderStatus =
  | "paid"
  | "shipping"
  | "delivered"
  | "shipping_failed";

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
  buyerName: string;   // denormalizado de Buyer App al momento de la venta
  paymentId: string;   // FK lógica → Payments App
  amount: number;      // cantidad de unidades compradas
  total: number;       // monto total cobrado al comprador
  fee: number;         // comisión de la plataforma
  status: OrderStatus;
  trackingCode: string | null; // lo emite Shipping App al despachar
  createdAt: Date;     // fuente para filtros por fecha
  updatedAt: Date;
};

// Vista enriquecida con joins que el data layer compone para listados.
export type OrderWithJoins = Order & {
  productTitle: string; // Product.title
};

// Información adicional del comprador.
// `name` viene de Buyer App (stub por ahora). `effectivePurchases` se calcula
// local a partir de la tabla `Sale`.
export type BuyerInfo = {
  name: string;
  effectivePurchases: number;
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
