"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6">
      <div className="text-center max-w-[440px]">
        <div className="w-16 h-16 rounded-full bg-bone text-danger flex items-center justify-center mx-auto mb-5">
          <Icon name="alert" size={28} />
        </div>
        <div className="font-mono text-xs uppercase tracking-[0.1em] text-ink-3 mb-2">
          Error inesperado
        </div>
        <h1 className="m-0 mb-3 text-2xl font-semibold tracking-[-0.02em]">
          Algo salió mal
        </h1>
        <p className="m-0 mb-6 text-sm text-ink-3 leading-[1.5]">
          Ocurrió un error al cargar esta sección. Podés reintentar; si persiste,
          recargá la página.
        </p>
        {error.digest && (
          <div className="font-mono text-[11px] text-ink-3 mb-5">
            ref: {error.digest}
          </div>
        )}
        <Button variant="primary" icon="refresh" onClick={reset}>
          Reintentar
        </Button>
      </div>
    </div>
  );
}
