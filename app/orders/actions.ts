"use server";

import { revalidatePath } from "next/cache";
import { advanceOrderStatus } from "@/lib/data/orders";

export async function advanceOrderStatusAction(orderId: string): Promise<void> {
  await advanceOrderStatus(orderId);
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
}
