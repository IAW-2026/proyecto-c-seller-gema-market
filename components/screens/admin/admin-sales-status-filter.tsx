"use client";

import { Pill } from "@/components/ui/pill";
import { useFilterParams } from "@/lib/hooks/use-filter-params";
import { ORDER_STATUS_META } from "@/lib/ui/ui-config";
import type { OrderStatus } from "@/types/domain";

const STATUSES: ReadonlyArray<OrderStatus> = [
  "paid",
  "shipping",
  "delivered",
  "shipping_failed",
];

export function AdminSalesStatusFilter({ active }: { active: string }) {
  const pushParams = useFilterParams();
  return (
    <div className="flex gap-2 mb-4 overflow-x-auto max-w-full no-scrollbar [-webkit-overflow-scrolling:touch]">
      <div className="shrink-0">
        <Pill
          size="md"
          active={active === "todos"}
          onClick={() => pushParams({ status: null })}
        >
          Todas
        </Pill>
      </div>
      {STATUSES.map((st) => (
        <div key={st} className="shrink-0">
          <Pill
            size="md"
            active={active === st}
            onClick={() => pushParams({ status: st })}
          >
            {ORDER_STATUS_META[st].label}
          </Pill>
        </div>
      ))}
    </div>
  );
}
