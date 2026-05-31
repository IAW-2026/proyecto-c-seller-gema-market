"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useActionFeedback } from "@/lib/hooks/use-action-feedback";
import { setSellerSuspendedAction } from "@/lib/actions/admin/sellers";

export type SellerSuspendButtonProps = {
  sellerId: string;
  shopName: string;
  suspended: boolean;
};

export function SellerSuspendButton({
  sellerId,
  shopName,
  suspended,
}: SellerSuspendButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { isPending, error, run } = useActionFeedback();

  const toggle = () =>
    run(
      async () => {
        await setSellerSuspendedAction(sellerId, !suspended);
        router.refresh();
      },
      { onSuccess: () => setOpen(false) },
    );

  // Reactivar es no destructivo → acción directa. Suspender pide confirmación.
  if (suspended) {
    return (
      <Button
        variant="success"
        size="sm"
        icon="refresh"
        onClick={toggle}
        disabled={isPending}
      >
        {isPending ? "…" : "Reactivar"}
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="danger"
        size="sm"
        icon="lock"
        onClick={() => setOpen(true)}
      >
        Suspender
      </Button>
      <ConfirmDialog
        open={open}
        tone="danger"
        title="Suspender tienda"
        description={
          <>
            ¿Suspender <strong>“{shopName}”</strong>? Sus publicaciones dejarán
            de aparecer en el catálogo y el vendedor no podrá acceder a su panel
            hasta que la reactives.
            {error && (
              <div className="mt-3 px-3 py-2 rounded-r2 bg-danger/10 text-danger text-[13px]">
                {error}
              </div>
            )}
          </>
        }
        confirmLabel="Suspender"
        pendingLabel="Suspendiendo…"
        confirmIcon="lock"
        isPending={isPending}
        onConfirm={toggle}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
