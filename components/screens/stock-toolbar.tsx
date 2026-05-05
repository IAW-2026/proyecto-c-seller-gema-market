"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

const SEARCH_DEBOUNCE_MS = 300;

export type StockToolbarProps = {
  initialQuery: string;
};

export function StockToolbar({ initialQuery }: StockToolbarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);

  if (prevInitialQuery !== initialQuery) {
    setPrevInitialQuery(initialQuery);
    setQuery(initialQuery);
  }

  useEffect(() => {
    if (query === initialQuery) return;
    const id = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (query) params.set("q", query);
      else params.delete("q");
      params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `/stock?${qs}` : "/stock", { scroll: false });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query, initialQuery, router]);

  return (
    <div className="mb-4">
      <Input
        icon="search"
        placeholder="Buscar por título…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Buscar productos en stock"
      />
    </div>
  );
}
