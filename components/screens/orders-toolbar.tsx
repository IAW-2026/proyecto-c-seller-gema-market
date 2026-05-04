"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, type TabItem } from "@/components/ui/tabs";

const SEARCH_DEBOUNCE_MS = 300;

export type OrdersToolbarProps = {
  initialQuery: string;
  activeTab: string;
  tabs: ReadonlyArray<TabItem>;
};

export function OrdersToolbar({ initialQuery, activeTab, tabs }: OrdersToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const lastPushedRef = useRef(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
    lastPushedRef.current = initialQuery;
  }, [initialQuery]);

  useEffect(() => {
    if (query === lastPushedRef.current) return;
    const id = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (query) params.set("q", query);
      else params.delete("q");
      params.delete("page");
      lastPushedRef.current = query;
      const qs = params.toString();
      router.replace(qs ? `/orders?${qs}` : "/orders", { scroll: false });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query, router]);

  const onTabChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "todos") params.delete("tab");
    else params.set("tab", next);
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `/orders?${qs}` : "/orders", { scroll: false });
  };

  return (
    <>
      <div className="mb-4 flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            icon="search"
            placeholder="Buscar por ID, comprador o tracking…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
