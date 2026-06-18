"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/auth/current-seller";
import { checkShopOrigin } from "@/lib/shipping/verify-shop-origin";
import {
  validateShopFields,
  type ShopFieldErrors,
  type ShopFieldName,
  type ShopFields,
} from "@/lib/auth/shop-fields";

// Re-exportamos los tipos con los nombres que usaba el form de onboarding
// para no romper sus imports.
export type OnboardingValues = ShopFields;
export type OnboardingState = {
  errors?: ShopFieldErrors;
  values?: OnboardingValues;
};

function readField(formData: FormData, name: ShopFieldName): string {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim() : "";
}

export async function completeOnboardingAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const seller = await requireSeller();

  const values: Record<ShopFieldName, string> = {
    shopName: readField(formData, "shopName"),
    phone: readField(formData, "phone"),
    city: readField(formData, "city"),
    street: readField(formData, "street"),
    number: readField(formData, "number"),
    postalCode: readField(formData, "postalCode"),
    apartment: readField(formData, "apartment"),
  };

  const errors = validateShopFields(values);
  if (Object.keys(errors).length > 0) {
    return { errors, values };
  }

  // La dirección debe existir y estar en zona de cobertura (Bahía Blanca).
  const originError = await checkShopOrigin({
    street: values.street,
    number: values.number,
    zip: values.postalCode,
  });
  if (originError) {
    return { errors: { street: originError }, values };
  }

  await prisma.seller.update({
    where: { id: seller.id },
    data: {
      shopName: values.shopName,
      phone: values.phone,
      city: values.city,
      street: values.street,
      number: values.number,
      postalCode: values.postalCode,
      apartment: values.apartment || null,
    },
  });

  revalidatePath("/", "layout");
  redirect("/");
}
