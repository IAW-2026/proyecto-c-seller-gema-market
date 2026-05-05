import 'server-only';
import type { BuyerInfo, Order, PaymentInfo, ShippingInfo } from "@/types/domain";

// Stubs — cuando se implemente el backend, estas funciones llaman APIs externas:
// getBuyerInfo    → GET /api/buyer/users/:buyerId
// getShippingInfo → GET /api/shipping/envios/:orderId
// getPaymentInfo  → GET /api/payments/ordenes-de-pago/:paymentId

export function getOrderBuyerInfo(order: Order): BuyerInfo {
  return {
    name: order.buyer,
    previousPurchases: 3, // TODO: obtener del Buyer App via order.buyerId
  };
}

export function getOrderShippingInfo(order: Order): ShippingInfo {
  return {
    carrier: "Repartidor asignado", // TODO: obtener del Shipping App
    trackingCode: order.trackId,
    address: order.address,
  };
}

export function getOrderPaymentInfo(_order: Order): PaymentInfo {
  return {
    method: "Mercado Pago",  // TODO: obtener del Payments App via order.paymentId
    statusLabel: "Aprobado",
    approved: true,
  };
}
