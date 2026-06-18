"use client";

import { useState, useTransition } from "react";
import { generateProductDraftAction } from "@/lib/actions/ai";
import type { ProductDraft } from "@/lib/ai/product-draft";
import { Icon } from "@/components/ui/icon";

export type AIWizardButtonProps = {
  title: string;
  imageUrls: ReadonlyArray<string>;
  onApplyAction: (draft: ProductDraft) => void;
};

// Devuelve un mensaje listo para mostrar al vendedor explicando qué falta,
// o null si los inputs ya son suficientes para llamar a la IA.
function describeMissingInputs(
  title: string,
  imageCount: number,
): string | null {
  const titleOk = title.trim().length > 0;
  const imagesOk = imageCount > 0;
  if (titleOk && imagesOk) return null;
  if (!titleOk && !imagesOk) {
    return "Agregá un título y al menos una imagen antes de usar el asistente.";
  }
  if (!titleOk) return "Agregá un título antes de usar el asistente.";
  return "Subí al menos una imagen antes de usar el asistente.";
}

export function AIWizardButton({
  title,
  imageUrls,
  onApplyAction,
}: AIWizardButtonProps) {
  const [isPending, startTransition] = useTransition();
  // Solo guardamos errores reales del backend. El aviso de "te faltan datos"
  // se deriva en render del estado actual de los inputs + un flag de intento,
  // así desaparece solo cuando el vendedor completa lo que faltaba.
  const [errorText, setErrorText] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);

  const missingMessage = describeMissingInputs(title, imageUrls.length);
  const showMissing = hasAttempted && missingMessage !== null;

  const handleClick = () => {
    setErrorText(null);
    if (missingMessage) {
      setHasAttempted(true);
      return;
    }
    setHasAttempted(false);
    startTransition(async () => {
      try {
        const draft = await generateProductDraftAction({ title, imageUrls });
        onApplyAction(draft);
      } catch (err) {
        setErrorText(
          err instanceof Error
            ? err.message
            : "No pudimos generar la sugerencia. Probá de nuevo.",
        );
      }
    });
  };

  return (
    <div className="flex flex-col gap-1.5 items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-busy={isPending}
        style={{
          backgroundImage: "linear-gradient(135deg, #a68a64 0%, #936639 100%)",
        }}
        className={`relative overflow-hidden inline-flex items-center gap-2 h-9 px-4 rounded-full text-[13px] font-semibold text-paper shadow-[0_2px_8px_rgba(166,138,100,0.25)] transition-[transform,box-shadow] duration-150 ${
          isPending
            ? "cursor-wait"
            : "cursor-pointer hover:shadow-[0_4px_14px_rgba(166,138,100,0.4)] hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98]"
        }`}
      >
        {isPending && (
          <span
            aria-hidden
            className="absolute inset-0 animate-shimmer pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
            }}
          />
        )}
        <Icon
          name="sparkle"
          size={16}
          className={`relative ${isPending ? "animate-pulse" : ""}`}
        />
        <span className="relative inline-flex items-baseline">
          {isPending ? "Generando" : "Completar con IA"}
          {isPending && (
            <span className="inline-flex ml-0.5" aria-hidden>
              <span
                className="animate-bounce"
                style={{ animationDelay: "0ms", animationDuration: "1s" }}
              >
                .
              </span>
              <span
                className="animate-bounce"
                style={{ animationDelay: "150ms", animationDuration: "1s" }}
              >
                .
              </span>
              <span
                className="animate-bounce"
                style={{ animationDelay: "300ms", animationDuration: "1s" }}
              >
                .
              </span>
            </span>
          )}
        </span>
      </button>
      {(errorText || showMissing) && (
        <span
          role={errorText ? "alert" : "status"}
          aria-live="polite"
          className={`text-[11px] leading-tight text-right max-w-[280px] ${
            errorText ? "text-danger" : "text-ink-3"
          }`}
        >
          {errorText ?? missingMessage}
        </span>
      )}
    </div>
  );
}
