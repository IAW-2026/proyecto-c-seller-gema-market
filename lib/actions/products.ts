"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/auth/current-seller";
import {
  saveProduct,
  updateProductStock,
  uploadProductImage,
} from "@/lib/data/products";
import type { ProductInput } from "@/types/domain";

export async function saveProductAction(input: ProductInput): Promise<void> {
  const seller = await requireSeller();
  await saveProduct(seller.id, input);
  revalidatePath("/products");
  if (input.id) {
    revalidatePath(`/products/${input.id}`);
  }
}

export async function updateProductStockAction(
  productId: string,
  stock: number,
): Promise<void> {
  await requireSeller();
  await updateProductStock(productId, stock);
  revalidatePath("/stock");
  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
}

export async function uploadProductImageAction(
  formData: FormData,
): Promise<string> {
  await requireSeller();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("uploadProductImageAction: 'file' inválido");
  }
  return uploadProductImage(file);
}
