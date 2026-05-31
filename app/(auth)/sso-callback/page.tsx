"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import { finalizeWithRedirect } from "@/lib/auth/finalize-redirect";

const DEST = "/dashboard";

// Callback del flujo OAuth (Google). Clerk redirige acá tras volver del
// proveedor; según el estado en que quedó el `signIn`/`signUp` finalizamos la
// sesión o transferimos entre flujos. Sigue la lógica oficial del Future API
// (custom flows / OAuth connections de Clerk). El gate de onboarding decide,
// ya con sesión activa, si el seller va a /dashboard o a /onboarding.
export default function SSOCallbackPage() {
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    void (async () => {
      if (!clerk.loaded || hasRun.current) return;
      hasRun.current = true;

      const goToSignIn = () => router.push("/sign-in");

      // 1. Sign-in ya completo (usuario existente que se logueó con Google).
      if (signIn.status === "complete") {
        await finalizeWithRedirect(signIn, router, DEST);
        return;
      }

      // 2. La cuenta ya existe: transferir el sign-up a un sign-in.
      if (signUp.isTransferable) {
        await signIn.create({ transfer: true });
        // `create` muta `signIn.status`; TS lo estrechó tras el chequeo de (1).
        const status = signIn.status as typeof signIn.status | "complete";
        if (status === "complete") {
          await finalizeWithRedirect(signIn, router, DEST);
          return;
        }
        goToSignIn();
        return;
      }

      // 3. Sign-in que requiere otro factor (no aplica a OAuth puro): al form.
      if (
        signIn.status === "needs_first_factor" &&
        !signIn.supportedFirstFactors?.every((f) => f.strategy === "enterprise_sso")
      ) {
        goToSignIn();
        return;
      }

      // 4. Usuario nuevo: transferir el sign-in a un sign-up. Con email-only
      //    como único requisito, el sign-up queda `complete` en un paso.
      if (signIn.isTransferable) {
        await signUp.create({ transfer: true });
        if (signUp.status === "complete") {
          await finalizeWithRedirect(signUp, router, DEST);
          return;
        }
        goToSignIn();
        return;
      }

      // 5. Sign-up ya completo.
      if (signUp.status === "complete") {
        await finalizeWithRedirect(signUp, router, DEST);
        return;
      }

      // 6. Sesión ya activa: activarla y redirigir.
      const sessionId =
        signIn.existingSession?.sessionId ?? signUp.existingSession?.sessionId;
      if (sessionId) {
        await clerk.setActive({
          session: sessionId,
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              router.push("/");
              return;
            }
            router.push(decorateUrl(DEST));
          },
        });
        return;
      }

      // Cualquier otro estado: volver al login.
      goToSignIn();
    })();
  }, [clerk, signIn, signUp, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <p className="text-sm text-ink-3">Completando el inicio de sesión…</p>
      {/* Clerk puede requerir bot protection al transferir a sign-up. */}
      <div id="clerk-captcha" />
    </div>
  );
}
