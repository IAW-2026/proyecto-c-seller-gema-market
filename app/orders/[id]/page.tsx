import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderDetailScreen } from "@/components/screens/order-detail-screen";
import { getCurrentSeller } from "@/lib/current-seller";
import { findOrder } from "@/lib/data/orders";
import { listProductsForOrder } from "@/lib/data/products";

type OrderPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: OrderPageProps): Promise<Metadata> {
  const { id } = await params;
  const order = findOrder(id);
  return {
    title: order ? `Pedido ${order.id}` : "Pedido no encontrado",
  };
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;
  const order = findOrder(id);
  if (!order || order.status === "pago_pendiente") {
    notFound();
  }
  const seller = await getCurrentSeller();
  const items = listProductsForOrder(order.items);
  return <OrderDetailScreen seller={seller} order={order} items={items} />;
}
