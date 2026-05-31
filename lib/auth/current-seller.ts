import 'server-only';
import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { createSellerFromIdentity, identityFromCurrentUser } from "@/lib/auth/sync-seller";
import { ensureDefaultRole } from "@/lib/auth/role";
import type { Seller } from "@/types/domain";

// Devuelve el Seller asociado al usuario autenticado de Clerk.
// La estrategia es lazy registration: la primera request autenticada que
// toca una ruta protegida crea el row a partir de `currentUser()`. Después
// vive en la DB y se lee directo (`findUnique`). No usamos webhooks de Clerk.
export const getCurrentSeller = cache(async (): Promise<Seller | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.seller.findUnique({ where: { clerkUserId: userId } });
  if (existing) return existing;

  const user = await currentUser();
  if (!user) return null;

  await ensureDefaultRole(user);
  return createSellerFromIdentity(identityFromCurrentUser(user));
});

// Variante que garantiza autenticación. Úsese en server actions y server
// components que requieren login. Lanza si no hay sesión activa.
export async function requireSeller(): Promise<Seller> {
  const seller = await getCurrentSeller();
  if (!seller) {
    throw new Error("Unauthorized");
  }
  return seller;
}
