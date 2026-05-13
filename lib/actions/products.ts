"use server";

import { updateTag } from "next/cache";
import { requireSeller } from "@/lib/auth/current-seller";
import {
  deleteProduct,
  saveProduct,
  updateProductStock,
  uploadProductImage,
} from "@/lib/data/products";
import type { ProductInput } from "@/types/domain";

// Tags que cubren listings, conteos y aggregates derivados de los productos
// del seller. Toda action que cree/edite/borre un producto los invalida.
function invalidateProductDependents(sellerId: string) {
  updateTag(`products-listing:${sellerId}`);
  updateTag(`products-counts:${sellerId}`);
  updateTag(`stock-summary:${sellerId}`);
  updateTag(`dashboard:${sellerId}`);
  updateTag(`shop:${sellerId}`);
}

export async function saveProductAction(input: ProductInput): Promise<void> {
  const seller = await requireSeller();
  await saveProduct(seller.id, input);
  invalidateProductDependents(seller.id);
  if (input.id) {
    updateTag(`product:${input.id}`);
  }
}

export async function updateProductStockAction(
  productId: string,
  stock: number,
): Promise<void> {
  const seller = await requireSeller();
  await updateProductStock(productId, seller.id, stock);
  updateTag(`products-listing:${seller.id}`);
  updateTag(`stock-summary:${seller.id}`);
  updateTag(`dashboard:${seller.id}`);
  updateTag(`product:${productId}`);
}

export async function deleteProductAction(productId: string): Promise<void> {
  const seller = await requireSeller();
  await deleteProduct(productId, seller.id);
  invalidateProductDependents(seller.id);
  updateTag(`product:${productId}`);
}

export async function uploadProductImageAction(
  formData: FormData,
): Promise<string> {
  const seller = await requireSeller();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("uploadProductImageAction: 'file' inválido");
  }
  return uploadProductImage(seller.id, file);
}
