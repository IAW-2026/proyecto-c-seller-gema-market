"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/auth/current-seller";
import {
  saveSeller,
  uploadSellerCover,
  uploadSellerLogo,
} from "@/lib/data/sellers";
import type { SellerInput } from "@/types/domain";

export async function saveSellerAction(input: SellerInput): Promise<void> {
  const seller = await requireSeller();
  await saveSeller(seller.id, input);
  revalidatePath("/shop");
}

async function fileFrom(formData: FormData, action: string): Promise<File> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error(`${action}: 'file' inválido`);
  }
  return file;
}

export async function uploadSellerCoverAction(
  formData: FormData,
): Promise<string> {
  const seller = await requireSeller();
  const file = await fileFrom(formData, "uploadSellerCoverAction");
  const url = await uploadSellerCover(seller.id, file);
  revalidatePath("/shop");
  return url;
}

export async function uploadSellerLogoAction(
  formData: FormData,
): Promise<string> {
  const seller = await requireSeller();
  const file = await fileFrom(formData, "uploadSellerLogoAction");
  const url = await uploadSellerLogo(seller.id, file);
  revalidatePath("/shop");
  return url;
}
