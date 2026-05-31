"use client";

import { Input } from "@/components/ui/input";
import { useDebouncedSearchParam } from "@/lib/hooks/use-debounced-search-param";

export type AdminSearchBarProps = {
  initialQuery: string;
  placeholder: string;
  ariaLabel: string;
};

// Búsqueda con debounce que sincroniza el parámetro `q` de la URL (resetea
// `page`). Misma mecánica que las toolbars del panel del seller.
export function AdminSearchBar({
  initialQuery,
  placeholder,
  ariaLabel,
}: AdminSearchBarProps) {
  const [query, setQuery] = useDebouncedSearchParam("q", initialQuery);
  return (
    <div className="mb-4">
      <Input
        icon="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={ariaLabel}
      />
    </div>
  );
}
