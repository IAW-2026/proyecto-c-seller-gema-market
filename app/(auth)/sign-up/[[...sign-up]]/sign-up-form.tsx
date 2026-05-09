"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ShopFieldsFieldset } from "@/components/forms/shop-fields-fieldset";
import { VerificationCodeStep } from "@/app/(auth)/_components/verification-code-step";
import { clerkErrorMessage } from "@/lib/auth/clerk-error-messages";
import { finalizeWithRedirect } from "@/lib/auth/finalize-redirect";
import {
  SHOP_FIELD_RULES,
  validateShopFields,
  type ShopFieldErrors,
  type ShopFieldName,
} from "@/lib/auth/shop-fields";

const DEFAULT_REDIRECT =
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL ?? "/dashboard";

type ShopValues = Record<ShopFieldName, string>;

const EMPTY_SHOP_VALUES: ShopValues = {
  shopName: "",
  phone: "",
  city: "",
  street: "",
  number: "",
  postalCode: "",
  apartment: "",
};

type Stage = "details" | "verify";

export function SignUpForm() {
  const { signUp, fetchStatus } = useSignUp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stage, setStage] = useState<Stage>("details");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shop, setShop] = useState<ShopValues>(EMPTY_SHOP_VALUES);
  const [shopErrors, setShopErrors] = useState<ShopFieldErrors>({});
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const pending = fetchStatus === "fetching";
  const redirectUrl = searchParams.get("redirect_url") ?? DEFAULT_REDIRECT;

  function handleShopChange(name: ShopFieldName, value: string) {
    setShop((prev) => ({ ...prev, [name]: value }));
    // Limpiar el error del campo apenas el usuario tipea.
    setShopErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  async function handleDetailsSubmit() {
    if (pending) return;

    setFormError(null);

    // Validamos los campos de tienda con las mismas reglas que la action de
    // /onboarding. Si fallan, no llamamos a Clerk — evitamos crear una cuenta
    // que después caería al gate de onboarding por datos inválidos.
    const errors = validateShopFields(shop);
    setShopErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const trimmedShop: Record<string, string> = {};
    for (const name of Object.keys(SHOP_FIELD_RULES) as ShopFieldName[]) {
      const v = shop[name].trim();
      if (v) trimmedShop[name] = v;
    }

    const { error } = await signUp.password({
      emailAddress: email,
      password,
      unsafeMetadata: trimmedShop,
    });

    if (error) {
      setFormError(clerkErrorMessage(error, "No pudimos crear la cuenta."));
      return;
    }

    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) {
      setFormError(
        clerkErrorMessage(
          sendError,
          "No pudimos enviar el código de verificación.",
        ),
      );
      return;
    }

    setStage("verify");
  }

  async function handleVerifySubmit() {
    if (pending) return;

    setFormError(null);
    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) {
      setFormError(clerkErrorMessage(error, "Código inválido."));
      return;
    }

    if (signUp.status === "complete") {
      const { error: finalizeError } = await finalizeWithRedirect(
        signUp,
        router,
        redirectUrl,
      );
      if (finalizeError) {
        setFormError(
          clerkErrorMessage(finalizeError, "No pudimos completar el registro."),
        );
      }
      return;
    }

    setFormError(
      "Tu cuenta requiere un paso adicional. Probá completar el registro desde el flujo estándar.",
    );
  }

  async function handleResendCode() {
    if (pending) return;
    setFormError(null);
    const { error } = await signUp.verifications.sendEmailCode();
    if (error) {
      setFormError(clerkErrorMessage(error, "No pudimos reenviar el código."));
    }
  }

  if (stage === "verify") {
    return (
      <VerificationCodeStep
        identifier={email}
        code={code}
        onCodeChange={setCode}
        onSubmit={handleVerifySubmit}
        onResend={handleResendCode}
        onBack={() => {
          setStage("details");
          setCode("");
          setFormError(null);
        }}
        error={formError}
        pending={pending}
      />
    );
  }

  return (
    <form action={handleDetailsSubmit} className="flex flex-col gap-5">
      <Field label="Email">
        <Input
          name="email"
          type="email"
          icon="mail"
          placeholder="vos@ejemplo.com"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Field label="Contraseña" hint="Mínimo 8 caracteres.">
        <Input
          name="password"
          type="password"
          icon="lock"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      <div className="border-t border-line pt-5 -mt-1">
        <div className="text-[13px] text-ink-2 font-medium mb-1">Tu tienda</div>
        <div className="text-xs text-ink-3 mb-4">
          Estos datos los van a ver los compradores. Vas a poder editarlos
          desde tu panel.
        </div>

        <ShopFieldsFieldset
          mode="controlled"
          values={shop}
          onChange={handleShopChange}
          errors={shopErrors}
        />
      </div>

      {/* Necesario para que Clerk pueda inyectar su widget de bot detection. */}
      <div id="clerk-captcha" />

      {formError && (
        <div
          role="alert"
          className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-r2 px-3 py-2"
        >
          {formError}
        </div>
      )}

      <Button type="submit" full disabled={pending}>
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
