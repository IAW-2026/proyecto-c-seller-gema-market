import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getRole } from "@/lib/auth/role";

// Landing post-login: enruta según el rol de Clerk. El admin entra al panel de
// administración; el resto, al panel del seller. Middleware ya garantiza que
// solo usuarios autenticados llegan acá.
//
// El acceso al rol (dato dinámico de Clerk) vive dentro de un Suspense para no
// romper `cacheComponents`: la página no tiene shell estático, el redirect
// ocurre en request time.
async function RoleRedirect() {
  const role = await getRole();
  redirect(role === "seller_admin" ? "/admin" : "/dashboard");
  return null;
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <RoleRedirect />
    </Suspense>
  );
}
