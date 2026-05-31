import 'server-only';
import { cache } from 'react';
import { currentUser } from '@clerk/nextjs/server';
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

// Gate para server components / layouts / actions del panel admin. Redirige al
// panel del seller si el usuario no es admin.
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect('/dashboard');
}
