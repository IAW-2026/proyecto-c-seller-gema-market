"use server";

import { updateTag } from "next/cache";
import { requireSeller } from "@/lib/auth/current-seller";
import { advanceOrderStatus, findOwnedOrderFresh } from "@/lib/data/orders";
import { requestShipping } from "@/lib/shipping/client";

export async function advanceOrderStatusAction(orderId: string): Promise<void> {
  const seller = await requireSeller();

  const order = await findOwnedOrderFresh(orderId, seller.id);
  if (!order) throw new Error(`Pedido ${orderId} no encontrado`);

  // Si la orden ya avanzó (doble click, otra pestaña, etc),
  // no se redisparala llamada al servicio de Shipping ni el update en DB.
  if (order.status !== "paid") return;

  const { trackingCode } = await requestShipping({
    orderId,
    sellerId: seller.id,
    buyerId: order.buyerId,
    originAddress: {
      street: seller.street,
      number: seller.number,
      zip: seller.postalCode,
      city: seller.city,
    },
  });

  await advanceOrderStatus(orderId, seller.id, trackingCode);

  updateTag(`orders-listing:${seller.id}`);
  updateTag(`orders-counts:${seller.id}`);
  updateTag(`dashboard:${seller.id}`);
  updateTag(`order:${orderId}`);
}
