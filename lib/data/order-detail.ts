import 'server-only';
import type { BuyerInfo, Order, PaymentInfo, ShippingInfo } from "@/types/domain";

// Stubs — cuando se implemente el backend, estas funciones llaman APIs externas:
// getBuyerInfo    → GET /api/buyer/users/:buyerId
// getShippingInfo → GET /api/shipping/envios/:orderId
// getPaymentInfo  → GET /api/payments/ordenes-de-pago/:paymentId

export function getOrderBuyerInfo(order: Order): BuyerInfo {
  return {
    name: order.buyerId, // placeholder hasta integrar Buyer App
    previousPurchases: 0,
  };
}

export function getOrderShippingInfo(order: Order): ShippingInfo {
  return {
    carrier: "Repartidor asignado",
    trackingCode: order.orderId, // placeholder hasta integrar Shipping App
    address: "Dirección a confirmar",
  };
}

export function getOrderPaymentInfo(order: Order): PaymentInfo {
  void order;
  return {
    method: "Mercado Pago",
    statusLabel: "Aprobado",
    approved: true,
  };
}
