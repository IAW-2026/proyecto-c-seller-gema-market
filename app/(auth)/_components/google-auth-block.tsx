"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { clerkErrorMessage } from "@/lib/auth/clerk-error-messages";
import { finalizeWithRedirect } from "@/lib/auth/finalize-redirect";

// Botón "Continuar con Google" + divisor "o", compartido entre sign-in y
// sign-up. Arranca el flujo OAuth con `signIn.sso`: sirve tanto para login como
// para registro porque si la cuenta no existe Clerk transfiere el flujo a
// sign-up en `/sso-callback` (ver app/(auth)/sso-callback/page.tsx).
//
// `redirectUrl` es el destino post-autenticación; lo pasa cada form (default
// /dashboard). El gate de onboarding redirige desde ahí si falta completar la
// tienda.
export function GoogleAuthBlock({ redirectUrl }: { redirectUrl: string }) {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const pending = fetchStatus === "fetching";

  async function handleClick() {
    setError(null);
    try {
      const { error } = await signIn.sso({
        strategy: "oauth_google",
        redirectCallbackUrl: "/sso-callback",
        redirectUrl,
      });
      if (error) {
        setError(clerkErrorMessage(error, "No pudimos conectar con Google."));
        return;
      }
      // Camino normal: el browser ya navegó a Google y este código no sigue.
      // Si seguimos acá es porque no hubo redirect (p.ej. ya había una sesión
      // activa y el sign-in quedó `complete`): finalizamos a mano.
      if (signIn.status === "complete") {
        await finalizeWithRedirect(signIn, router, redirectUrl);
      }
    } catch (err) {
      console.error("Google SSO error:", err);
      setError("No pudimos conectar con Google. Intentá de nuevo.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Button
        type="button"
        variant="secondary"
        full
        disabled={pending}
        onClick={handleClick}
      >
        <GoogleIcon />
        Continuar con Google
      </Button>

      {error && (
        <div
          role="alert"
          className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-r2 px-3 py-2"
        >
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-ink-3">
        <span className="h-px flex-1 bg-line" />
        o
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
