import 'server-only';
import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { identityFromCurrentUser, upsertSellerFromIdentity } from "@/lib/auth/sync-seller";
import type { Seller } from "@/types/domain";

// Devuelve el Seller asociado al usuario autenticado de Clerk.
// Si la sesión existe pero el row aún no fue creado (el webhook no llegó a
// tiempo, falló, o el evento user.created se perdió), lo provisiona on-demand
// a partir de `currentUser()`. El webhook sigue siendo el sync canónico para
// updates posteriores.
export const getCurrentSeller = cache(async (): Promise<Seller | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.seller.findUnique({ where: { clerkUserId: userId } });
  if (existing) return existing;

  const user = await currentUser();
  if (!user) return null;

  return upsertSellerFromIdentity(identityFromCurrentUser(user));
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
