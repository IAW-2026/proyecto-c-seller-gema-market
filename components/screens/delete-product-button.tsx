"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icon } from "@/components/ui/icon";
import { useActionFeedback } from "@/lib/hooks/use-action-feedback";
import { deleteProductAction } from "@/lib/actions/products";

export type DeleteProductButtonVariant = "icon" | "full";

export type DeleteProductButtonProps = {
  productId: string;
  productName: string;
  variant?: DeleteProductButtonVariant;
  redirectTo?: string;
};

export function DeleteProductButton({
  productId,
  productName,
  variant = "icon",
  redirectTo,
}: DeleteProductButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { isPending, error, run } = useActionFeedback();

  const handleConfirm = () => {
    run(
      () => deleteProductAction(productId),
      {
        onSuccess: () => {
          setOpen(false);
          if (redirectTo) router.push(redirectTo);
        },
      },
    );
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Eliminar ${productName}`}
          className="w-8 h-8 rounded-full bg-danger/10 text-danger inline-flex items-center justify-center hover:bg-danger/15 transition-colors"
        >
          <Icon name="trash" size={14} />
        </button>
      ) : (
        <Button
          variant="danger"
          icon="trash"
          onClick={() => setOpen(true)}
        >
          Eliminar publicación
        </Button>
      )}
      <ConfirmDialog
        open={open}
        tone="danger"
        title="Eliminar publicación"
        description={
          <>
            ¿Querés eliminar <strong>“{productName}”</strong>? La publicación
            dejará de aparecer en tu catálogo y no se podrá recuperar desde el
            panel. Las ventas y reservas históricas se conservan intactas.
            {error && (
              <div className="mt-3 px-3 py-2 rounded-r2 bg-danger/10 text-danger text-[13px]">
                {error}
              </div>
            )}
          </>
        }
        confirmLabel="Eliminar"
        pendingLabel="Eliminando…"
        cancelLabel="Cancelar"
        confirmIcon="trash"
        isPending={isPending}
        onConfirm={handleConfirm}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
