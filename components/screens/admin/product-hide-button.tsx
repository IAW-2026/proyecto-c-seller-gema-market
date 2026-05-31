"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useActionFeedback } from "@/lib/hooks/use-action-feedback";
import { setProductHiddenAction } from "@/lib/actions/admin/products";

export type ProductHideButtonProps = {
  productId: string;
  hidden: boolean;
};

// Toggle reversible (ocultar/mostrar). No pide confirmación: es de bajo riesgo y
// fácilmente reversible.
export function ProductHideButton({ productId, hidden }: ProductHideButtonProps) {
  const router = useRouter();
  const { isPending, run } = useActionFeedback();

  const toggle = () =>
    run(async () => {
      await setProductHiddenAction(productId, !hidden);
      router.refresh();
    });

  return hidden ? (
    <Button
      variant="success"
      size="sm"
      icon="eye"
      onClick={toggle}
      disabled={isPending}
    >
      {isPending ? "…" : "Mostrar"}
    </Button>
  ) : (
    <Button
      variant="secondary"
      size="sm"
      icon="lock"
      onClick={toggle}
      disabled={isPending}
    >
      {isPending ? "…" : "Ocultar"}
    </Button>
  );
}
