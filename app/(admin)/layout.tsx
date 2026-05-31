import { Suspense, type ReactNode } from "react";
import { AdminChrome } from "@/components/layout/admin-chrome";
import { requireAdmin } from "@/lib/auth/role";

// Gate del panel admin: solo usuarios con `publicMetadata.role === 'seller_admin'`
// en Clerk. `requireAdmin` redirige a `/dashboard` a cualquier otro. Vive en un
// Suspense para no romper `cacheComponents`.
async function AdminGate() {
  await requireAdmin();
  return null;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminChrome>
      <Suspense fallback={null}>
        <AdminGate />
      </Suspense>
      {children}
    </AdminChrome>
  );
}
