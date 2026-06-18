"use client";

import { useEffect, type RefObject } from "react";

// Cierra un popover/menú haciendo click fuera del contenedor referenciado.
// Solo registra el listener cuando `isOpen` es true para no escuchar de más.
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  isOpen: boolean,
  onClose: () => void,
): void {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, isOpen, onClose]);
}
