import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderDetailScreen } from "@/components/screens/order-detail-screen";
import { OrderDetailSkeleton } from "@/components/screens/skeletons/order-detail-skeleton";
import { findOrder } from "@/lib/data/orders";
import { findProduct } from "@/lib/data/products";
import { getOrderBuyerInfo, getOrderPaymentInfo, getOrderShippingInfo } from "@/lib/data/order-detail";

type OrderPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const { id } = await params;
  const order = await findOrder(id);
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
  const { id } = await params;
  const order = await findOrder(id);
  // El seller no opera órdenes sin pago confirmado; las ocultamos del detalle.
  if (!order || order.status === "pending_payment") notFound();

  const product = await findProduct(order.productId);
  if (!product) notFound();

  const buyerInfo = getOrderBuyerInfo(order);
  const shippingInfo = getOrderShippingInfo(order);
  const paymentInfo = getOrderPaymentInfo(order);

  return (
    <OrderDetailScreen
      order={order}
      product={product}
      buyerInfo={buyerInfo}
      shippingInfo={shippingInfo}
      paymentInfo={paymentInfo}
    />
  );
}
