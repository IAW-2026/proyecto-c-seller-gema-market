"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, type TabItem } from "@/components/ui/tabs";

const SEARCH_DEBOUNCE_MS = 300;

export type ProductsToolbarProps = {
  initialQuery: string;
  activeTab: string;
  tabs: ReadonlyArray<TabItem>;
};

export function ProductsToolbar({
  initialQuery,
  activeTab,
  tabs,
}: ProductsToolbarProps) {
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
      lastPushedRef.current = query;
      const qs = params.toString();
      router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query, router]);

  const onTabChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "active") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
  };

  return (
    <>
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <Input
            icon="search"
            placeholder="Buscar por título o SKU…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar publicaciones"
          />
        </div>
        <Button variant="secondary" icon="filter">
          Filtros
        </Button>
      </div>
      <Tabs
        tabs={tabs}
        active={activeTab}
        onChange={onTabChange}
        ariaLabel="Filtrar publicaciones"
      />
    </>
  );
}
