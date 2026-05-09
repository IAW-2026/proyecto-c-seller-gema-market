"use client";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

// Paso de "verificar código por email", compartido entre sign-in (segundo
// factor) y sign-up (verificación de email). El markup es idéntico — solo
// cambian el copy del header, el handler de submit y el de "Volver".
export type VerificationCodeStepProps = {
  identifier: string;
  code: string;
  onCodeChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  onResend: () => void | Promise<void>;
  onBack: () => void;
  error: string | null;
  pending: boolean;
  submitLabel?: string;
};

export function VerificationCodeStep({
  identifier,
  code,
  onCodeChange,
  onSubmit,
  onResend,
  onBack,
  error,
  pending,
  submitLabel = "Verificar y entrar",
}: VerificationCodeStepProps) {
  return (
    <form action={onSubmit} className="flex flex-col gap-5">
      <div className="text-sm text-ink-2">
        Te enviamos un código a{" "}
        <span className="font-medium text-ink">{identifier}</span>. Ingresalo
        para terminar.
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
          onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, ""))}
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
        {pending ? "Verificando…" : submitLabel}
      </Button>

      <div className="flex justify-between text-xs">
        <button
          type="button"
          onClick={onBack}
          className="text-ink-3 hover:text-ink underline-offset-2 hover:underline cursor-pointer"
        >
          Volver
        </button>
        <button
          type="button"
          onClick={onResend}
          disabled={pending}
          className="text-olive font-medium hover:underline underline-offset-2 cursor-pointer disabled:opacity-50"
        >
          Reenviar código
        </button>
      </div>
    </form>
  );
}
