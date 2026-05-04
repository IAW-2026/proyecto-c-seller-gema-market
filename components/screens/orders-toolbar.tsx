"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, type TabItem } from "@/components/ui/tabs";

export type OrdersToolbarProps = {
  activeTab: string;
  tabs: ReadonlyArray<TabItem>;
};

export function OrdersToolbar({ activeTab, tabs }: OrdersToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onTabChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "todos") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    router.replace(qs ? `/orders?${qs}` : "/orders", { scroll: false });
  };

  return (
    <>
      <div className="mb-4 flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            icon="search"
            placeholder="Buscar por ID, comprador…"
            aria-label="Buscar pedidos"
          />
        </div>
        <Button variant="secondary" icon="calendar">
          Últimos 30 días
        </Button>
      </div>
      <Tabs
        tabs={tabs}
        active={activeTab}
        onChange={onTabChange}
        ariaLabel="Filtrar pedidos"
      />
    </>
  );
}
