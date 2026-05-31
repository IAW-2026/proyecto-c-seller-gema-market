"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/role";
import { setSellerSuspended } from "@/lib/data/admin/sellers";

// Suspende o reactiva una tienda. Suspender excluye sus productos del catálogo
// público y bloquea su panel (ver `(seller)/layout.tsx`). Invalida los caches
// públicos del seller para que el cambio se refleje de inmediato.
export async function setSellerSuspendedAction(
  sellerId: string,
  suspended: boolean,
): Promise<void> {
  await requireAdmin();
  await setSellerSuspended(sellerId, suspended);
  updateTag(`shop:${sellerId}`);
  updateTag(`dashboard:${sellerId}`);
}
