"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ShopFieldsFieldset } from "@/components/forms/shop-fields-fieldset";
import {
  completeOnboardingAction,
  type OnboardingState,
  type OnboardingValues,
} from "@/lib/actions/onboarding";

const INITIAL_STATE: OnboardingState = {};

export type OnboardingFormProps = {
  initialValues: OnboardingValues;
};

// El form es uncontrolled: cada input usa `defaultValue`. En caso de error,
// la action devuelve `state.values` con lo que el usuario escribió, y el
// browser conserva esos valores en el DOM tras el re-render. Así no hace
// falta state local.
export function OnboardingForm({ initialValues }: OnboardingFormProps) {
  const [state, formAction, pending] = useActionState(
    completeOnboardingAction,
    INITIAL_STATE,
  );

  const defaults: OnboardingValues = { ...initialValues, ...state.values };

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <ShopFieldsFieldset
        mode="uncontrolled"
        defaultValues={defaults}
        errors={state.errors}
        autoFocusFirst
      />
      <Button type="submit" full disabled={pending}>
        {pending ? "Guardando…" : "Continuar"}
      </Button>
    </form>
  );
}
