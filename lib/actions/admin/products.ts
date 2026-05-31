"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/role";
import { setProductHidden } from "@/lib/data/admin/products";

// Oculta o muestra una publicación. Ocultar la excluye del catálogo público sin
// importar su `status`; el seller no puede revertirlo desde su panel. Invalida
// los caches del seller dueño para reflejar el cambio.
export async function setProductHiddenAction(
  productId: string,
  hidden: boolean,
): Promise<void> {
  await requireAdmin();
  const { sellerId } = await setProductHidden(productId, hidden);
  updateTag(`products-listing:${sellerId}`);
  updateTag(`shop:${sellerId}`);
  updateTag(`dashboard:${sellerId}`);
  updateTag(`product:${productId}`);
}
