"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, type TabItem } from "@/components/ui/tabs";

export type OrdersToolbarProps = {
  activeTab: string;
  tabs: ReadonlyArray<TabItem>;
};

export function OrdersToolbar({ activeTab, tabs }: OrdersToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onTabChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "todos") params.delete("tab");
    else params.set("tab", next);
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <Tabs
      tabs={tabs}
      active={activeTab}
      onChange={onTabChange}
      ariaLabel="Filtrar pedidos"
    />
  );
}
