"use server";

import { updateTag } from "next/cache";
import { requireSeller } from "@/lib/auth/current-seller";
import { validateShopFields } from "@/lib/auth/shop-fields";
import { checkShopOrigin } from "@/lib/shipping/verify-shop-origin";
import {
  saveSeller,
  uploadSellerCover,
  uploadSellerLogo,
} from "@/lib/data/sellers";
import type { SellerInput } from "@/types/domain";

export async function saveSellerAction(input: SellerInput): Promise<void> {
  const seller = await requireSeller();
  // Backstop server-side: el form también valida en el cliente, pero el server
  // es la fuente de verdad. Mismas reglas que onboarding (validateShopFields).
  if (Object.keys(validateShopFields(input)).length > 0) {
    throw new Error("Revisá los datos de la tienda: hay campos obligatorios o inválidos.");
  }

  // Solo verificamos contra Shipping si la dirección cambió: evita una llamada
  // al servicio en ediciones que no la tocan (nombre, bio, teléfono).
  const addressChanged =
    input.street !== seller.street ||
    input.number !== seller.number ||
    input.postalCode !== seller.postalCode;
  if (addressChanged) {
    const originError = await checkShopOrigin({
      street: input.street,
      number: input.number,
      zip: input.postalCode,
    });
    if (originError) throw new Error(originError);
  }

  await saveSeller(seller.id, input);
  updateTag(`shop:${seller.id}`);
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
  updateTag(`shop:${seller.id}`);
  return url;
}

export async function uploadSellerLogoAction(
  formData: FormData,
): Promise<string> {
  const seller = await requireSeller();
  const file = await fileFrom(formData, "uploadSellerLogoAction");
  const url = await uploadSellerLogo(seller.id, file);
  updateTag(`shop:${seller.id}`);
  return url;
}
