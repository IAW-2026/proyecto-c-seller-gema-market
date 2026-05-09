"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

  const onRangeChange = (next: OrderDateRange) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", next);
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="mb-4 flex gap-3 flex-wrap">
      <div className="flex-1 min-w-[200px]">
        <Input
          icon="search"
          placeholder="Buscar por título o comprador…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar pedidos por título o comprador"
        />
      </div>
      <label className="relative inline-flex items-center">
        <span className="sr-only">Rango de fechas</span>
        <Icon
          name="calendar"
          size={16}
          className="absolute left-3.5 text-ink-3 pointer-events-none"
        />
        <select
          value={dateRange}
          onChange={(e) => onRangeChange(e.target.value as OrderDateRange)}
          aria-label="Rango de fechas"
          className="h-[42px] pl-9 pr-9 rounded-full bg-paper border border-line-2 text-sm font-medium appearance-none cursor-pointer"
        >
          {dateRangeOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevronDown"
          size={14}
          className="absolute right-3.5 text-ink-3 pointer-events-none"
        />
      </label>
    </div>
  );
}
