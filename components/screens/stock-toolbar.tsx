"use client";

import { Input } from "@/components/ui/input";
import { useDebouncedSearchParam } from "@/lib/hooks/use-debounced-search-param";

export type StockToolbarProps = {
  initialQuery: string;
};

export function StockToolbar({ initialQuery }: StockToolbarProps) {
  const [query, setQuery] = useDebouncedSearchParam("q", initialQuery);

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
