"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { useDebouncedSearchParam } from "@/lib/hooks/use-debounced-search-param";

const STOCK_SORT_OPTIONS = [
  { value: "stock_asc", label: "Menor a mayor" },
  { value: "stock_desc", label: "Mayor a menor" },
] as const;

const STATUS_OPTIONS = [
  { value: "active", label: "Activo" },
  { value: "paused", label: "Pausado" },
] as const;

export type StockToolbarProps = {
  initialQuery: string;
};

export function StockToolbar({ initialQuery }: StockToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useDebouncedSearchParam("q", initialQuery);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const currentSort = searchParams.get("sort") ?? "";
  const currentStatus = searchParams.get("status") ?? "";

  const activeFilterCount = [currentSort, currentStatus].filter(Boolean).length;

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

  const toggleSort = (value: string) => {
    pushParams({ sort: currentSort === value ? null : value });
  };

  const toggleStatus = (value: string) => {
    pushParams({ status: currentStatus === value ? null : value });
  };

  const clearAll = () => {
    pushParams({ sort: null, status: null });
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
          aria-label="Buscar productos en stock"
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
              Stock
            </div>
            <div className="flex flex-col gap-1 mb-4">
              {STOCK_SORT_OPTIONS.map((opt) => (
                <FilterOption
                  key={opt.value}
                  active={currentSort === opt.value}
                  onClick={() => toggleSort(opt.value)}
                  label={opt.label}
                />
              ))}
            </div>

            <div className="pt-3 border-t border-line">
              <div className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-ink-3 mb-2">
                Estado
              </div>
              <div className="flex flex-col gap-1">
                {STATUS_OPTIONS.map((opt) => (
                  <FilterOption
                    key={opt.value}
                    active={currentStatus === opt.value}
                    onClick={() => toggleStatus(opt.value)}
                    label={opt.label}
                  />
                ))}
              </div>
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

function FilterOption({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left text-[13px] flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-colors ${
        active
          ? "bg-bone text-cocoa font-semibold"
          : "text-ink hover:bg-cream"
      }`}
    >
      <span className="w-3.5 shrink-0">
        {active && <Icon name="check" size={13} />}
      </span>
      {label}
    </button>
  );
}
