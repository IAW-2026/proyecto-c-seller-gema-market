"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const DEFAULT_REDIRECT =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ?? "/dashboard";

export function SignInForm() {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const pending = fetchStatus === "fetching";
  const redirectUrl = searchParams.get("redirect_url") ?? DEFAULT_REDIRECT;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;

    setError(null);
    const passwordRes = await signIn.password({ identifier, password });
    if (passwordRes.error) {
      setError(passwordRes.error.message ?? "No pudimos iniciar sesión.");
      return;
    }

    if (signIn.status === "complete") {
      const finalizeRes = await signIn.finalize({
        navigate: ({ decorateUrl }) => router.push(decorateUrl(redirectUrl)),
      });
      if (finalizeRes.error) {
        setError(finalizeRes.error.message ?? "No pudimos completar el inicio de sesión.");
      }
      return;
    }

    setError(
      "Tu cuenta requiere un paso adicional. Probá entrar desde el flujo estándar.",
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
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
