"use server";

import { updateTag } from "next/cache";
import { requireSeller } from "@/lib/auth/current-seller";
import { advanceOrderStatus } from "@/lib/data/orders";

export async function advanceOrderStatusAction(orderId: string): Promise<void> {
  const seller = await requireSeller();
  await advanceOrderStatus(orderId, seller.id);
  updateTag(`orders-listing:${seller.id}`);
  updateTag(`orders-counts:${seller.id}`);
  updateTag(`dashboard:${seller.id}`);
  updateTag(`order:${orderId}`);
}
