"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { useDebouncedSearchParam } from "@/lib/hooks/use-debounced-search-param";

const SORT_FIELDS = [
  { value: "price", label: "Precio" },
  { value: "sales", label: "Ventas" },
  { value: "stock", label: "Stock" },
  { value: "created", label: "Fecha" },
] as const;

type SortField = (typeof SORT_FIELDS)[number]["value"];

export type ProductsFiltersBarProps = {
  initialQuery: string;
};

export function ProductsFiltersBar({ initialQuery }: ProductsFiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useDebouncedSearchParam("q", initialQuery);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const currentSort = searchParams.get("sort") ?? "";
  const currentStockFilter = searchParams.get("stockFilter") ?? "";

  const currentField = (SORT_FIELDS.map((f) => f.value).find((f) =>
    currentSort.startsWith(f),
  ) ?? "") as SortField | "";
  const currentDir = currentSort.endsWith("_asc") ? "asc" : currentSort.endsWith("_desc") ? "desc" : "";

  const activeFilterCount = [currentSort, currentStockFilter].filter(Boolean).length;

  useEffect(() => {
    if (!isFilterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isFilterOpen]);

  const pushParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const setField = (field: SortField) => {
    if (currentField === field) {
      pushParams({ sort: null });
    } else {
      const dir = currentDir || "desc";
      pushParams({ sort: `${field}_${dir}` });
    }
  };

  const setDir = (dir: "asc" | "desc") => {
    if (!currentField) return;
    pushParams({ sort: `${currentField}_${dir}` });
  };

  const toggleStockFilter = () => {
    pushParams({ stockFilter: currentStockFilter === "out" ? null : "out" });
  };

  const clearAll = () => {
    pushParams({ sort: null, stockFilter: null });
    setIsFilterOpen(false);
  };

  return (
    <div className="flex gap-3 mb-4 flex-wrap">
      <div className="flex-1 min-w-[220px]">
        <Input
          icon="search"
          placeholder="Buscar por título…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar publicaciones"
        />
      </div>
      <div ref={filterRef} className="relative">
        <Button
          variant={activeFilterCount > 0 ? "soft" : "secondary"}
          icon="filter"
          onClick={() => setIsFilterOpen((v) => !v)}
        >
          Filtros{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
        </Button>

        {isFilterOpen && (
          <div className="absolute right-0 top-full mt-2 z-50 bg-paper border border-line rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-4 w-[280px]">
            <div className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-ink-3 mb-2">
              Ordenar por
            </div>
            <div className="flex gap-1.5 mb-3">
              {SORT_FIELDS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setField(f.value)}
                  className={`flex-1 text-[12px] font-medium py-1.5 rounded-xl transition-colors ${
                    currentField === f.value
                      ? "bg-bone text-cocoa font-semibold"
                      : "bg-cream text-ink hover:bg-bone"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-ink-3 mb-2">
              Dirección
            </div>
            <div className="flex gap-1.5 mb-4">
              {(
                [
                  { value: "asc", label: "↑ Menor a mayor" },
                  { value: "desc", label: "↓ Mayor a menor" },
                ] as const
              ).map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDir(d.value)}
                  disabled={!currentField}
                  className={`flex-1 text-[12px] font-medium py-1.5 rounded-xl transition-colors disabled:opacity-40 ${
                    currentDir === d.value && currentField
                      ? "bg-bone text-cocoa font-semibold"
                      : "bg-cream text-ink hover:bg-bone"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-line">
              <div className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-ink-3 mb-2">
                Filtrar
              </div>
              <button
                type="button"
                onClick={toggleStockFilter}
                className={`w-full text-left text-[13px] flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-colors ${
                  currentStockFilter === "out"
                    ? "bg-bone text-cocoa font-semibold"
                    : "text-ink hover:bg-cream"
                }`}
              >
                <span className="w-3.5 shrink-0">
                  {currentStockFilter === "out" && <Icon name="check" size={13} />}
                </span>
                Sin stock
              </button>
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="mt-3 pt-3 border-t border-line w-full text-[12px] text-ink-3 hover:text-danger text-left transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
