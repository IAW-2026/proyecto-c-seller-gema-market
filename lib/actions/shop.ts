"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/auth/current-seller";
import { saveSeller, uploadSellerCover } from "@/lib/data/sellers";
import type { SellerInput } from "@/types/domain";

export async function saveSellerAction(input: SellerInput): Promise<void> {
  const seller = await requireSeller();
  await saveSeller(seller.id, input);
  revalidatePath("/shop");
}

export async function uploadSellerCoverAction(
  formData: FormData,
): Promise<string> {
  await requireSeller();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("uploadSellerCoverAction: 'file' inválido");
  }
  const url = await uploadSellerCover(file);
  revalidatePath("/shop");
  return url;
}
