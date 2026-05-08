"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { clerkErrorMessage } from "@/lib/auth/clerk-error-messages";

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
    const finalizeRes = await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        // Si Clerk activa un session task obligatorio (ej. enroll MFA, reset
        // password) la app no se mete: lo deja para que Clerk lo resuelva en
        // su propio flujo. Caemos a la home.
        if (session?.currentTask) {
          router.push("/");
          return;
        }
        router.push(decorateUrl(redirectUrl));
      },
    });
    if (finalizeRes.error) {
      setError(
        clerkErrorMessage(
          finalizeRes.error,
          "No pudimos completar el inicio de sesión.",
        ),
      );
    }
  }

  async function handleCredentialsSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
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

  async function handleSecondFactorSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
      <form onSubmit={handleSecondFactorSubmit} className="flex flex-col gap-5">
        <div className="text-sm text-ink-2">
          Te enviamos un código a{" "}
          <span className="font-medium text-ink">{identifier}</span>. Ingresalo para
          terminar de iniciar sesión.
        </div>

        <Field label="Código de verificación">
          <Input
            name="code"
            icon="mail"
            placeholder="123456"
            inputMode="numeric"
            pattern="\d*"
            autoComplete="one-time-code"
            autoFocus
            required
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
        </Field>

        {error && (
          <div
            role="alert"
            className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-r2 px-3 py-2"
          >
            {error}
          </div>
        )}

        <Button type="submit" full disabled={pending}>
          {pending ? "Verificando…" : "Verificar y entrar"}
        </Button>

        <div className="flex justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              setStage("credentials");
              setCode("");
              setError(null);
            }}
            className="text-ink-3 hover:text-ink underline-offset-2 hover:underline cursor-pointer"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={handleResendCode}
            disabled={pending}
            className="text-olive font-medium hover:underline underline-offset-2 cursor-pointer disabled:opacity-50"
          >
            Reenviar código
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-5">
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
  );
}
