"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/auth/current-seller";
import { advanceOrderStatus } from "@/lib/data/orders";

export async function advanceOrderStatusAction(orderId: string): Promise<void> {
  const seller = await requireSeller();
  await advanceOrderStatus(orderId, seller.id);
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
}
