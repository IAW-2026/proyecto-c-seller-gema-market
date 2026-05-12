"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { useDebouncedSearchParam } from "@/lib/hooks/use-debounced-search-param";
import type { OrderDateRange } from "@/types/domain";

export type OrdersFiltersBarProps = {
  initialQuery: string;
  dateRange: OrderDateRange;
  dateRangeOptions: ReadonlyArray<{ id: OrderDateRange; label: string }>;
};

export function OrdersFiltersBar({
  initialQuery,
  dateRange,
  dateRangeOptions,
}: OrdersFiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useDebouncedSearchParam("q", initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    dateRangeOptions.find((opt) => opt.id === dateRange)?.label ?? "Fechas";

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const onRangeChange = (next: OrderDateRange) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", next);
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    setIsOpen(false);
  };

  return (
    <div className="mb-4 flex gap-3 flex-nowrap">
      <div className="flex-1 min-w-0">
        <Input
          icon="search"
          placeholder="Buscar pedidos…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar pedidos por título o comprador"
        />
      </div>
      <div ref={popoverRef} className="relative shrink-0">
        <Button
          variant="secondary"
          icon="calendar"
          onClick={() => setIsOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="hidden sm:inline">{selectedLabel}</span>
          <span className="sm:hidden">Fechas</span>
        </Button>

        {isOpen && (
          <div
            role="listbox"
            className="absolute right-0 top-full mt-2 z-50 bg-paper border border-line rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-2 w-[220px]"
          >
            {dateRangeOptions.map((opt) => {
              const isActive = opt.id === dateRange;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => onRangeChange(opt.id)}
                  className={`w-full text-left text-[13px] flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-colors ${
                    isActive
                      ? "bg-bone text-cocoa font-semibold"
                      : "text-ink hover:bg-cream"
                  }`}
                >
                  <span className="w-3.5 shrink-0">
                    {isActive && <Icon name="check" size={13} />}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
