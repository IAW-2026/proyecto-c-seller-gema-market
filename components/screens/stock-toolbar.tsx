"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

const SEARCH_DEBOUNCE_MS = 300;

export type StockToolbarProps = {
  initialQuery: string;
};

export function StockToolbar({ initialQuery }: StockToolbarProps) {
  const router = useRouter();
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
      router.replace(qs ? `/stock?${qs}` : "/stock", { scroll: false });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query, router]);

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
