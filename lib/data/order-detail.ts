import 'server-only';
import { prisma } from '@/lib/db';
import type { BuyerInfo, Order, PaymentInfo } from "@/types/domain";

export async function getOrderBuyerInfo(order: Order): Promise<BuyerInfo> {
  // Toda la info del comprador se computa local: el nombre lo persistimos en
  // `Sale.buyerName` cuando se concreta la compra, y el total de compras se
  // deriva contando ventas del mismo buyer al mismo seller.
  const effectivePurchases = await prisma.sale.count({
    where: {
      buyerId: order.buyerId,
      sellerId: order.sellerId,
    },
  });

  return {
    name: order.buyerName,
    effectivePurchases,
  };
}


// Para el alcance del proyecto, el flujo en SellerApp siempre comienza con la
// confirmación de la compra desde PaymentsApp, la cual siempre utiliza Mercado Pago.
// Por esto, el método siempre será Mercado Pago con estado Aprobado.
export function getOrderPaymentInfo(order: Order): PaymentInfo {
  void order;
  return {
    method: "Mercado Pago",
    statusLabel: "Aprobado",
    approved: true,
  };
}
