import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderDetailScreen } from "@/components/screens/order-detail-screen";
import { OrderDetailSkeleton } from "@/components/screens/skeletons/order-detail-skeleton";
import { requireSeller } from "@/lib/auth/current-seller";
import { findOwnedOrder } from "@/lib/data/orders";
import { findOwnedProductIncludingDeleted } from "@/lib/data/products";
import { getOrderBuyerInfo, getOrderPaymentInfo } from "@/lib/data/order-detail";
import { getShipmentTrackingUrl } from "@/lib/shipping/client";

type OrderPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const [{ id }, seller] = await Promise.all([params, requireSeller()]);
  const order = await findOwnedOrder(id, seller.id);
  return { title: order ? `Pedido ${order.id}` : "Pedido no encontrado" };
}

export default function OrderPage({ params }: OrderPageProps) {
  return (
    <Suspense fallback={<OrderDetailSkeleton />}>
      <OrderContent params={params} />
    </Suspense>
  );
}

async function OrderContent({ params }: OrderPageProps) {
  const [{ id }, seller] = await Promise.all([params, requireSeller()]);
  const order = await findOwnedOrder(id, seller.id);
  if (!order) notFound();

  const product = await findOwnedProductIncludingDeleted(order.productId, seller.id);
  if (!product) notFound();

  const buyerInfo = await getOrderBuyerInfo(order);
  const paymentInfo = getOrderPaymentInfo(order);

  // Link al tracking que expone la Shipping App. Solo se consulta mientras el
  // envío está en curso y hay código; degrada a null sin romper el detalle.
  const trackingUrl =
    order.status === "shipping" && order.trackingCode
      ? await getShipmentTrackingUrl(order.orderId)
      : null;

  return (
    <OrderDetailScreen
      order={order}
      product={product}
      buyerInfo={buyerInfo}
      paymentInfo={paymentInfo}
      trackingUrl={trackingUrl}
    />
  );
}
