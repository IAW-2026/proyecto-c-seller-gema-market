import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSeller } from "@/lib/auth/current-seller";
import { isOnboarded } from "@/lib/auth/onboarding";
import type { OnboardingValues } from "@/lib/actions/onboarding";
import { OnboardingForm } from "./onboarding-form";
import { SignOutLink } from "./sign-out-link";

export const metadata: Metadata = {
  title: "Bienvenido",
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-md bg-paper border border-line rounded-r3 p-7 shadow-sm">
        <header className="mb-6">
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-ink">
            Configurá tu tienda
          </h1>
          <p className="text-sm text-ink-3 mt-1.5">
            Completá estos datos para activar tu cuenta de vendedor. Vas a
            poder editarlos después desde tu panel.
          </p>
        </header>

        <Suspense fallback={null}>
          <OnboardingFormSection />
        </Suspense>

        <footer className="mt-6 pt-4 border-t border-line text-center">
          <SignOutLink />
        </footer>
      </div>
    </div>
  );
}

// Carga el Seller actual y prepara los valores iniciales para el form. Si ya
// completó el onboarding, lo manda al panel. Vive en un Suspense para
// mantener la página renderizable bajo `cacheComponents`.
async function OnboardingFormSection() {
  const seller = await getCurrentSeller();
  if (!seller) redirect("/sign-in");
  if (isOnboarded(seller)) redirect("/");

  const initialValues: OnboardingValues = {
    shopName: seller.shopName,
    phone: seller.phone,
    city: seller.city,
    street: seller.street,
    number: seller.number,
    apartment: seller.apartment ?? "",
    postalCode: seller.postalCode,
  };

  return <OnboardingForm initialValues={initialValues} />;
}
