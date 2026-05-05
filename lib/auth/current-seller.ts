import 'server-only';
import { cache } from "react";
import { getDefaultSeller } from "@/lib/data/sellers";
import type { Seller } from "@/types/domain";

// Devuelve el vendedor autenticado para la request actual.
// TODO: reemplazar con `await currentUser()` de @clerk/nextjs una vez
// que se configure Clerk. La firma debe permanecer igual.
export const getCurrentSeller = cache(async (): Promise<Seller> => {
  return getDefaultSeller();
});

// Variante que garantiza autenticación: lanza si no hay sesión activa.
// Usar en Server Actions y rutas que requieren login.
export async function requireSeller(): Promise<Seller> {
  const seller = await getCurrentSeller();
  if (!seller) {
    throw new Error("Unauthorized");
  }
  return seller;
}
