"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "./icon";
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from "@/types/domain";

export type PagerProps = {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
};

export function Pager({ page, pageSize, total, basePath }: PagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const navigate = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  };

  const goTo = (next: number) => {
    const clamped = Math.min(Math.max(1, next), totalPages);
    if (clamped === page) return;
    navigate({ page: clamped === 1 ? null : String(clamped) });
  };

  const onPageSizeChange = (next: number) => {
    navigate({
      pageSize: next === DEFAULT_PAGE_SIZE ? null : String(next),
      page: null,
    });
  };

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-line text-[12.5px] text-ink-3">
      <div className="font-mono">
        {total === 0 ? "Sin resultados" : `${from}–${to} de ${total}`}
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-[0.06em] font-mono">Por página</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-paper border border-line-2 rounded-xl text-xs px-2 py-1 cursor-pointer text-ink"
            aria-label="Resultados por página"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1 ml-2">
          <button
            type="button"
            onClick={() => goTo(page - 1)}
            disabled={prevDisabled}
            aria-label="Página anterior"
            className="w-8 h-8 rounded-full bg-paper border border-line-2 inline-flex items-center justify-center text-ink disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="chevronLeft" size={14} />
          </button>
          <span className="px-2 text-ink font-medium tabular-nums">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => goTo(page + 1)}
            disabled={nextDisabled}
            aria-label="Página siguiente"
            className="w-8 h-8 rounded-full bg-paper border border-line-2 inline-flex items-center justify-center text-ink disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="chevronRight" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
