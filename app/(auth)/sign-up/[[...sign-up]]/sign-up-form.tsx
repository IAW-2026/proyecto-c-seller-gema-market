"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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

  // Helpers para no repetir el patrón controlado en cada `<Input>`.
  const setShopField = useMemo(
    () => (name: ShopFieldName) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      setShop((prev) => ({ ...prev, [name]: next }));
      // Limpiar el error del campo apenas el usuario tipea.
      setShopErrors((prev) => {
        if (!prev[name]) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
    },
    [],
  );

  async function handleDetailsSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
      setFormError(error.message ?? "No pudimos crear la cuenta.");
      return;
    }

    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) {
      setFormError(
        sendError.message ?? "No pudimos enviar el código de verificación.",
      );
      return;
    }

    setStage("verify");
  }

  async function handleVerifySubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;

    setFormError(null);
    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) {
      setFormError(error.message ?? "Código inválido.");
      return;
    }

    if (signUp.status === "complete") {
      const { error: finalizeError } = await signUp.finalize({
        navigate: ({ decorateUrl }) => router.push(decorateUrl(redirectUrl)),
      });
      if (finalizeError) {
        setFormError(
          finalizeError.message ?? "No pudimos completar el registro.",
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
      setFormError(error.message ?? "No pudimos reenviar el código.");
    }
  }

  if (stage === "verify") {
    return (
      <form onSubmit={handleVerifySubmit} className="flex flex-col gap-5">
        <div className="text-sm text-ink-2">
          Te enviamos un código a{" "}
          <span className="font-medium text-ink">{email}</span>. Ingresalo para
          terminar de crear la cuenta.
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

        {formError && (
          <div
            role="alert"
            className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-r2 px-3 py-2"
          >
            {formError}
          </div>
        )}

        <Button type="submit" full disabled={pending}>
          {pending ? "Verificando…" : "Verificar y entrar"}
        </Button>

        <div className="flex justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              setStage("details");
              setCode("");
              setFormError(null);
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
    <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-5">
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

        <div className="flex flex-col gap-5">
          <Field
            label={SHOP_FIELD_RULES.shopName.label}
            error={shopErrors.shopName}
          >
            <Input
              name="shopName"
              icon="tag"
              placeholder="Ej: Carpintería Sur"
              required
              minLength={SHOP_FIELD_RULES.shopName.min}
              maxLength={SHOP_FIELD_RULES.shopName.max}
              autoComplete="off"
              value={shop.shopName}
              onChange={setShopField("shopName")}
            />
          </Field>

          <Field label={SHOP_FIELD_RULES.phone.label} error={shopErrors.phone}>
            <Input
              name="phone"
              type="tel"
              placeholder="+54 11 5555 5555"
              required
              minLength={SHOP_FIELD_RULES.phone.min}
              maxLength={SHOP_FIELD_RULES.phone.max}
              autoComplete="tel"
              value={shop.phone}
              onChange={setShopField("phone")}
            />
          </Field>

          <Field label={SHOP_FIELD_RULES.city.label} error={shopErrors.city}>
            <Input
              name="city"
              placeholder="Ej: Buenos Aires"
              required
              maxLength={SHOP_FIELD_RULES.city.max}
              autoComplete="address-level2"
              value={shop.city}
              onChange={setShopField("city")}
            />
          </Field>

          <div className="grid grid-cols-[1fr_120px] gap-3">
            <Field
              label={SHOP_FIELD_RULES.street.label}
              error={shopErrors.street}
            >
              <Input
                name="street"
                placeholder="Av. Corrientes"
                required
                maxLength={SHOP_FIELD_RULES.street.max}
                autoComplete="address-line1"
                value={shop.street}
                onChange={setShopField("street")}
              />
            </Field>
            <Field
              label={SHOP_FIELD_RULES.number.label}
              error={shopErrors.number}
            >
              <Input
                name="number"
                placeholder="1234"
                required
                maxLength={SHOP_FIELD_RULES.number.max}
                value={shop.number}
                onChange={setShopField("number")}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label={SHOP_FIELD_RULES.apartment.label}
              optional
              error={shopErrors.apartment}
            >
              <Input
                name="apartment"
                placeholder="3°B"
                maxLength={SHOP_FIELD_RULES.apartment.max}
                autoComplete="address-line2"
                value={shop.apartment}
                onChange={setShopField("apartment")}
              />
            </Field>
            <Field
              label={SHOP_FIELD_RULES.postalCode.label}
              error={shopErrors.postalCode}
            >
              <Input
                name="postalCode"
                placeholder="1414"
                required
                maxLength={SHOP_FIELD_RULES.postalCode.max}
                autoComplete="postal-code"
                value={shop.postalCode}
                onChange={setShopField("postalCode")}
              />
            </Field>
          </div>
        </div>
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
