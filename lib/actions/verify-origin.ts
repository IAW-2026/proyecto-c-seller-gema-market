"use server";

import { checkShopOrigin } from "@/lib/shipping/verify-shop-origin";
import type { VerifyShopOriginInput } from "@/lib/shipping/client";

export type VerifyShopOriginActionResult =
  | { ok: true }
  | { ok: false; message: string };

// Acción que consume el form de sign-up (cliente) para verificar la dirección
// de origen antes de crear la cuenta en Clerk. No requiere sesión: el usuario
// todavía no es seller.
export async function verifyShopOriginAction(
  input: VerifyShopOriginInput,
): Promise<VerifyShopOriginActionResult> {
  const message = await checkShopOrigin(input);
  return message ? { ok: false, message } : { ok: true };
}
