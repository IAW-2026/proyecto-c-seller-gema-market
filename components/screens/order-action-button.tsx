"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { advanceOrderStatusAction } from "@/app/orders/actions";
import { ORDER_TIMELINE } from "@/lib/ui/ui-config";
import { nextOrderStatus, type OrderStatus } from "@/types/domain";

const NEXT_STATUS_LABEL: Readonly<Record<OrderStatus, string>> = {
  pending_payment:  "",
  paid:             "Marcar como despachado",
  shipping:         "",
  delivered:        "",
  shipping_failed:  "",
  cancelled:        "",
  disputed:         "",
  refunded:         "",
};

export type OrderActionButtonProps = {
  orderId: string;
  status: OrderStatus;
};

export function OrderActionButton({ orderId, status }: OrderActionButtonProps) {
  const [isPending, startTransition] = useTransition();

  const next = nextOrderStatus(status);

  if (!next) {
    const externalStep = ORDER_TIMELINE.find((s) => s.external);
    if (status === "shipping" && externalStep) {
      return (
        <span className="text-[13px] text-ink-3">
          Esperando confirmación de entrega
        </span>
      );
    }
    return null;
  }

  const label = NEXT_STATUS_LABEL[status];

  return (
    <Button
      variant="accent"
      icon="check"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await advanceOrderStatusAction(orderId);
        })
      }
    >
      {isPending ? "Actualizando…" : label}
    </Button>
  );
}
