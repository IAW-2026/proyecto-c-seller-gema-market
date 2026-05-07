"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  completeOnboardingAction,
  type OnboardingState,
  type OnboardingValues,
} from "@/lib/actions/onboarding";

const INITIAL_STATE: OnboardingState = {};

export type OnboardingFormProps = {
  initialValues: OnboardingValues;
};

// El form es uncontrolled: cada `<Input>` usa `defaultValue`. En caso de
// error, la action devuelve `state.values` con lo que el usuario escribió, y
// React re-renderiza preservando esos valores. Así no hace falta state local.
export function OnboardingForm({ initialValues }: OnboardingFormProps) {
  const [state, formAction, pending] = useActionState(
    completeOnboardingAction,
    INITIAL_STATE,
  );

  const value = (name: keyof OnboardingValues): string =>
    state.values?.[name] ?? initialValues[name] ?? "";
  const error = (name: keyof OnboardingValues): string | undefined =>
    state.errors?.[name];

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field
        label="Nombre de tu tienda"
        hint="Es lo que van a ver los compradores."
        error={error("shopName")}
      >
        <Input
          name="shopName"
          icon="tag"
          placeholder="Ej: Carpintería Sur"
          autoFocus
          required
          minLength={2}
          maxLength={60}
          autoComplete="off"
          defaultValue={value("shopName")}
        />
      </Field>

      <Field label="Teléfono" error={error("phone")}>
        <Input
          name="phone"
          type="tel"
          placeholder="+54 11 5555 5555"
          required
          minLength={6}
          maxLength={30}
          autoComplete="tel"
          defaultValue={value("phone")}
        />
      </Field>

      <Field label="Ciudad" error={error("city")}>
        <Input
          name="city"
          placeholder="Ej: Buenos Aires"
          required
          maxLength={80}
          autoComplete="address-level2"
          defaultValue={value("city")}
        />
      </Field>

      <div className="grid grid-cols-[1fr_120px] gap-3">
        <Field label="Calle" error={error("street")}>
          <Input
            name="street"
            placeholder="Av. Corrientes"
            required
            maxLength={80}
            autoComplete="address-line1"
            defaultValue={value("street")}
          />
        </Field>
        <Field label="Número" error={error("number")}>
          <Input
            name="number"
            placeholder="1234"
            required
            maxLength={20}
            defaultValue={value("number")}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Depto" optional error={error("apartment")}>
          <Input
            name="apartment"
            placeholder="3°B"
            maxLength={20}
            autoComplete="address-line2"
            defaultValue={value("apartment")}
          />
        </Field>
        <Field label="Código postal" error={error("postalCode")}>
          <Input
            name="postalCode"
            placeholder="1414"
            required
            maxLength={15}
            autoComplete="postal-code"
            defaultValue={value("postalCode")}
          />
        </Field>
      </div>

      <Button type="submit" full disabled={pending}>
        {pending ? "Guardando…" : "Continuar"}
      </Button>
    </form>
  );
}
