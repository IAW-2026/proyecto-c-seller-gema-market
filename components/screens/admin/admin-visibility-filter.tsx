"use client";

import { Pill } from "@/components/ui/pill";
import { useFilterParams } from "@/lib/hooks/use-filter-params";
import type { AdminVisibility } from "@/lib/data/admin/products";

const OPTIONS: ReadonlyArray<{ id: AdminVisibility; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "visible", label: "Visibles" },
  { id: "hidden", label: "Ocultos" },
];

export function AdminVisibilityFilter({ active }: { active: AdminVisibility }) {
  const pushParams = useFilterParams();
  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      {OPTIONS.map((opt) => (
        <Pill
          key={opt.id}
          size="md"
          active={opt.id === active}
          onClick={() =>
            pushParams({ visibility: opt.id === "all" ? null : opt.id })
          }
        >
          {opt.label}
        </Pill>
      ))}
    </div>
  );
}
