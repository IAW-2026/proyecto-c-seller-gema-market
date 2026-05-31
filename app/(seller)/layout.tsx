import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { SellerChrome } from "@/components/layout/seller-chrome";
import { getCurrentSeller } from "@/lib/auth/current-seller";
import { isAdmin } from "@/lib/auth/role";
import { isOnboarded, ONBOARDING_PATH } from "@/lib/auth/onboarding";

// Gate dinámico: bloquea el panel hasta que el seller completó /onboarding.
// Vive en un Suspense para no romper `cacheComponents` (la parte estática del
// chrome se renderiza igual; este componente solo redirige si hace falta).
async function OnboardingGate() {
  // Un admin que llega manualmente al panel del seller se manda al suyo, antes
  // de tocar la lógica de onboarding (que no aplica a su rol).
  if (await isAdmin()) redirect("/admin");
  const seller = await getCurrentSeller();
  if (!seller) redirect("/sign-in");
  // Suspendido por un admin: el panel queda bloqueado. La página de aviso vive
  // fuera del grupo (seller) para no reentrar en este gate (loop).
  if (seller.suspended) redirect("/cuenta-suspendida");
  if (!isOnboarded(seller)) redirect(ONBOARDING_PATH);
  return null;
}

export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <SellerChrome>
      <Suspense fallback={null}>
        <OnboardingGate />
      </Suspense>
      {children}
    </SellerChrome>
  );
}
