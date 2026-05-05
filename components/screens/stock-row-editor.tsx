"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { updateProductStockAction } from "@/app/products/actions";

type Props = {
  productId: string;
  initialStock: number;
  productName: string;
};

export function StockRowEditor({ productId, initialStock, productName }: Props) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(initialStock);
  const [inputVal, setInputVal] = useState(String(initialStock));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const open = () => {
    setInputVal(String(saved));
    setError(null);
    setEditing(true);
  };

  const confirm = () => {
    const parsed = Number.parseInt(inputVal, 10);
    const final = isNaN(parsed) ? 0 : Math.max(0, parsed);
    setError(null);
    startTransition(async () => {
      try {
        await updateProductStockAction(productId, final);
        setSaved(final);
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  };

  const adjust = (delta: number) => {
    const current = Number.parseInt(inputVal, 10) || 0;
    setInputVal(String(Math.max(0, current + delta)));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d+$/.test(val)) setInputVal(val);
  };

  return (
    <div className="flex flex-col items-center justify-center h-8">
      {editing ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Reducir"
            onClick={() => adjust(-1)}
            disabled={isPending}
            className="w-7 h-7 rounded-full bg-bone inline-flex items-center justify-center hover:bg-[#e8e2d9] transition-colors shrink-0 disabled:opacity-50"
          >
            <Icon name="minus" size={12} />
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={inputVal}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === "Enter" && confirm()}
            autoFocus
            disabled={isPending}
            className="w-11 text-center text-[13px] font-semibold bg-bone rounded-lg px-1 py-1 border-0 outline-none"
            aria-label="Cantidad de stock"
          />
          <button
            type="button"
            aria-label="Aumentar"
            onClick={() => adjust(1)}
            disabled={isPending}
            className="w-7 h-7 rounded-full bg-bone inline-flex items-center justify-center hover:bg-[#e8e2d9] transition-colors shrink-0 disabled:opacity-50"
          >
            <Icon name="plus" size={12} />
          </button>
          <button
            type="button"
            aria-label="Confirmar"
            onClick={confirm}
            disabled={isPending}
            className="w-7 h-7 rounded-full bg-forest text-paper inline-flex items-center justify-center hover:opacity-90 transition-opacity shrink-0 disabled:opacity-50"
          >
            <Icon name="check" size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label={`Editar stock de ${productName}`}
          onClick={open}
          className="w-8 h-8 rounded-full bg-bone inline-flex items-center justify-center hover:bg-[#e8e2d9] transition-colors"
        >
          <Icon name="plus" size={14} />
        </button>
      )}
      {error && (
        <span className="text-[10px] text-danger mt-0.5" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
