import 'server-only';
import { cache } from 'react';
import { currentUser, clerkClient, type User } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { Role } from '@/types/domain';

// El rol del usuario vive en Clerk (`publicMetadata.role`), no en la DB. Se
// setea desde el dashboard de Clerk o con `scripts/set-admin.ts`. Un usuario
// sin metadata se trata como "seller" — así el flujo existente queda intacto y
// solo los usuarios marcados explícitamente acceden al panel admin.
//
// Se lee con `currentUser()` (cero config en Clerk). Alternativa alineada con
// "claims del JWT": exponer `metadata` en el session token y leerlo de
// `auth().sessionClaims` — opcional, ver README.
export const getRole = cache(async (): Promise<Role> => {
  const user = await currentUser();
  const role = user?.publicMetadata?.role;
  return role === 'seller_admin' ? 'seller_admin' : 'seller';
});

export async function isAdmin(): Promise<boolean> {
  return (await getRole()) === 'seller_admin';
}

// Setea `publicMetadata.role = 'seller'` la primera vez que vemos a un usuario
// sin rol (lo invoca `getCurrentSeller` al crear el Seller). El default de
// `getRole()` ya trata la ausencia como "seller"; esto lo deja explícito en
// Clerk. No pisa un rol existente (p.ej. `seller_admin`).
export async function ensureDefaultRole(user: User): Promise<void> {
  if (user.publicMetadata?.role) return;
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(user.id, {
      publicMetadata: { ...user.publicMetadata, role: 'seller' satisfies Role },
    });
  } catch {
    // Best-effort: si la escritura falla, el usuario sigue funcionando porque
    // la ausencia se trata como "seller". No rompemos el primer login.
  }
}

// Gate para server components / layouts / actions del panel admin. Redirige al
// panel del seller si el usuario no es admin.
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect('/dashboard');
}
