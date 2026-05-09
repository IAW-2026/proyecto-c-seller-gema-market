"use client";

import type { ChangeEvent } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  SHOP_FIELD_RULES,
  type ShopFieldErrors,
  type ShopFieldName,
  type ShopFields,
} from "@/lib/auth/shop-fields";

// Soporta dos modos:
// - Controlado: el parent pasa `values` + `onChange`. Útil cuando el form
//   maneja state local (sign-up).
// - No controlado: el parent pasa `defaultValues`. Útil cuando el form usa
//   `useActionState` y delega la persistencia del valor a la action y al DOM
//   (onboarding).
//
// Las reglas (label, min, max, optional) se leen siempre de `SHOP_FIELD_RULES`
// para que un cambio en la fuente canónica se propague a ambos forms.

type ControlledProps = {
  mode: "controlled";
  values: Required<Pick<ShopFields, ShopFieldName>>;
  onChange: (name: ShopFieldName, value: string) => void;
};

type UncontrolledProps = {
  mode: "uncontrolled";
  defaultValues?: ShopFields;
};

export type ShopFieldsFieldsetProps = (ControlledProps | UncontrolledProps) & {
  errors?: ShopFieldErrors;
  autoFocusFirst?: boolean;
};

export function ShopFieldsFieldset(props: ShopFieldsFieldsetProps) {
  const { errors, autoFocusFirst } = props;

  const fieldProps = (name: ShopFieldName) => {
    if (props.mode === "controlled") {
      const handle = (e: ChangeEvent<HTMLInputElement>) =>
        props.onChange(name, e.target.value);
      return { value: props.values[name], onChange: handle };
    }
    return { defaultValue: props.defaultValues?.[name] ?? "" };
  };

  const rules = SHOP_FIELD_RULES;

  return (
    <div className="flex flex-col gap-5">
      <Field
        label={rules.shopName.label}
        hint="Es lo que van a ver los compradores."
        error={errors?.shopName}
      >
        <Input
          name="shopName"
          icon="tag"
          placeholder="Ej: Carpintería Sur"
          required
          minLength={rules.shopName.min}
          maxLength={rules.shopName.max}
          autoComplete="off"
          autoFocus={autoFocusFirst}
          {...fieldProps("shopName")}
        />
      </Field>

      <Field label={rules.phone.label} error={errors?.phone}>
        <Input
          name="phone"
          type="tel"
          placeholder="+54 11 5555 5555"
          required
          minLength={rules.phone.min}
          maxLength={rules.phone.max}
          autoComplete="tel"
          {...fieldProps("phone")}
        />
      </Field>

      <Field label={rules.city.label} error={errors?.city}>
        <Input
          name="city"
          placeholder="Ej: Buenos Aires"
          required
          maxLength={rules.city.max}
          autoComplete="address-level2"
          {...fieldProps("city")}
        />
      </Field>

      <div className="grid grid-cols-[1fr_120px] gap-3">
        <Field label={rules.street.label} error={errors?.street}>
          <Input
            name="street"
            placeholder="Av. Corrientes"
            required
            maxLength={rules.street.max}
            autoComplete="address-line1"
            {...fieldProps("street")}
          />
        </Field>
        <Field label={rules.number.label} error={errors?.number}>
          <Input
            name="number"
            placeholder="1234"
            required
            maxLength={rules.number.max}
            {...fieldProps("number")}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={rules.apartment.label} optional error={errors?.apartment}>
          <Input
            name="apartment"
            placeholder="3°B"
            maxLength={rules.apartment.max}
            autoComplete="address-line2"
            {...fieldProps("apartment")}
          />
        </Field>
        <Field label={rules.postalCode.label} error={errors?.postalCode}>
          <Input
            name="postalCode"
            placeholder="1414"
            required
            maxLength={rules.postalCode.max}
            autoComplete="postal-code"
            {...fieldProps("postalCode")}
          />
        </Field>
      </div>
    </div>
  );
}
