"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icon";

// Dropdown reutilizable para reemplazar `<select>` nativos cuando queremos
// mantener la estética del panel. Mismo patrón visual que el dropdown de
// "Por página" en `pager.tsx` y el panel de filtros: trigger pill-like +
// listbox flotante con check al lado del item activo.

export type SelectOption<T extends string> = {
  value: T;
  label: string;
};

export type SelectProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<SelectOption<T>>;
  placeholder?: string;
  ariaLabel?: string;
};

export function Select<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Seleccionar…",
  ariaLabel,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={`w-full h-[46px] flex items-center gap-2 px-3.5 rounded-r2 border-2 text-sm text-ink transition-[border-color,background-color] duration-150 focus-visible:outline-none focus-visible:border-olive ${
          isOpen
            ? "border-olive bg-paper"
            : "border-line bg-cream hover:bg-bone hover:border-ink-3"
        }`}
      >
        <span
          className={`flex-1 text-left truncate ${selected ? "" : "text-ink-3"}`}
        >
          {selected?.label ?? placeholder}
        </span>
        <Icon
          name="chevronDown"
          size={16}
          className={`shrink-0 text-ink-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 z-50 bg-paper border border-line rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-2 max-h-[280px] overflow-y-auto"
        >
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
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
  );
}
