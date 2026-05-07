import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { SellerChrome } from "@/components/layout/seller-chrome";
import { getCurrentSeller } from "@/lib/auth/current-seller";
import { isOnboarded, ONBOARDING_PATH } from "@/lib/auth/onboarding";

// Gate dinámico: bloquea el panel hasta que el seller completó /onboarding.
// Vive en un Suspense para no romper `cacheComponents` (la parte estática del
// chrome se renderiza igual; este componente solo redirige si hace falta).
async function OnboardingGate() {
  const seller = await getCurrentSeller();
  if (!seller) redirect("/sign-in");
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
