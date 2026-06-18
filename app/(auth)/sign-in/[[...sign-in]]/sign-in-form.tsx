"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { VerificationCodeStep } from "@/app/(auth)/_components/verification-code-step";
import { GoogleAuthBlock } from "@/app/(auth)/_components/google-auth-block";
import { clerkErrorMessage } from "@/lib/auth/clerk-error-messages";
import { finalizeWithRedirect } from "@/lib/auth/finalize-redirect";

const DEFAULT_REDIRECT =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ?? "/dashboard";

type Stage = "credentials" | "second_factor";

export function SignInForm() {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<Stage>("credentials");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const pending = fetchStatus === "fetching";
  const redirectUrl = searchParams.get("redirect_url") ?? DEFAULT_REDIRECT;

  async function finalizeAndRedirect() {
    const finalizeRes = await finalizeWithRedirect(signIn, router, redirectUrl);
    if (finalizeRes.error) {
      setError(
        clerkErrorMessage(
          finalizeRes.error,
          "No pudimos completar el inicio de sesión.",
        ),
      );
    }
  }

  async function handleCredentialsSubmit() {
    if (pending) return;

    setError(null);
    const passwordRes = await signIn.password({ identifier, password });
    if (passwordRes.error) {
      setError(clerkErrorMessage(passwordRes.error, "No pudimos iniciar sesión."));
      return;
    }

    if (signIn.status === "complete") {
      await finalizeAndRedirect();
      return;
    }

    if (signIn.status === "needs_second_factor") {
      const supportsEmailCode = (signIn.supportedSecondFactors ?? []).some(
        (f) => f.strategy === "email_code",
      );
      if (!supportsEmailCode) {
        // El attempt queda enganchado en `needs_second_factor`. Reseteamos
        // para que el usuario pueda reintentar (otra cuenta, por ejemplo)
        // sin recargar la página.
        await signIn.reset();
        setError("Tu cuenta tiene 2FA activado con un método que aún no soportamos.");
        return;
      }

      setStage("second_factor");
      const sendRes = await signIn.mfa.sendEmailCode();
      if (sendRes.error) {
        setError(clerkErrorMessage(sendRes.error, "No pudimos enviar el código."));
      }
      return;
    }

    setError(
      "Tu cuenta requiere un paso adicional. Probá entrar desde el flujo estándar.",
    );
  }

  async function handleSecondFactorSubmit() {
    if (pending) return;

    setError(null);
    const verifyRes = await signIn.mfa.verifyEmailCode({ code });
    if (verifyRes.error) {
      setError(clerkErrorMessage(verifyRes.error, "Código inválido."));
      return;
    }

    if (signIn.status === "complete") {
      await finalizeAndRedirect();
      return;
    }

    setError("No pudimos completar el inicio de sesión.");
  }

  async function handleResendCode() {
    if (pending) return;
    setError(null);
    const sendRes = await signIn.mfa.sendEmailCode();
    if (sendRes.error) {
      setError(clerkErrorMessage(sendRes.error, "No pudimos reenviar el código."));
    }
  }

  if (stage === "second_factor") {
    return (
      <VerificationCodeStep
        identifier={identifier}
        code={code}
        onCodeChange={setCode}
        onSubmit={handleSecondFactorSubmit}
        onResend={handleResendCode}
        onBack={() => {
          setStage("credentials");
          setCode("");
          setError(null);
        }}
        error={error}
        pending={pending}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <GoogleAuthBlock redirectUrl={redirectUrl} />

      <form action={handleCredentialsSubmit} className="flex flex-col gap-5">
      <Field label="Email">
        <Input
          name="identifier"
          type="email"
          icon="mail"
          placeholder="vos@ejemplo.com"
          autoComplete="email"
          autoFocus
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
      </Field>

      <Field label="Contraseña">
        <Input
          name="password"
          type="password"
          icon="lock"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      {/* Necesario para que Clerk pueda inyectar su widget de bot detection. */}
      <div id="clerk-captcha" />

      {error && (
        <div
          role="alert"
          className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-r2 px-3 py-2"
        >
          {error}
        </div>
      )}

      <Button type="submit" full disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
      </form>
    </div>
  );
}
