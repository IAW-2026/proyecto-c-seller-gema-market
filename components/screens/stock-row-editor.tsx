"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

type Props = {
  initialStock: number;
  productName: string;
};

export function StockRowEditor({ initialStock, productName }: Props) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(initialStock);
  const [inputVal, setInputVal] = useState(String(initialStock));

  const open = () => {
    setInputVal(String(saved));
    setEditing(true);
  };

  const confirm = () => {
    const parsed = parseInt(inputVal, 10);
    const final = isNaN(parsed) ? 0 : Math.max(0, parsed);
    setSaved(final);
    setEditing(false);
  };

  const adjust = (delta: number) => {
    const current = parseInt(inputVal, 10) || 0;
    setInputVal(String(Math.max(0, current + delta)));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d+$/.test(val)) setInputVal(val);
  };

  return (
    <div className="flex items-center justify-center h-8">
      {editing ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Reducir"
            onClick={() => adjust(-1)}
            className="w-7 h-7 rounded-full bg-bone inline-flex items-center justify-center hover:bg-[#e8e2d9] transition-colors shrink-0"
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
            className="w-11 text-center text-[13px] font-semibold bg-bone rounded-lg px-1 py-1 border-0 outline-none"
            aria-label="Cantidad de stock"
          />
          <button
            type="button"
            aria-label="Aumentar"
            onClick={() => adjust(1)}
            className="w-7 h-7 rounded-full bg-bone inline-flex items-center justify-center hover:bg-[#e8e2d9] transition-colors shrink-0"
          >
            <Icon name="plus" size={12} />
          </button>
          <button
            type="button"
            aria-label="Confirmar"
            onClick={confirm}
            className="w-7 h-7 rounded-full bg-forest text-paper inline-flex items-center justify-center hover:opacity-90 transition-opacity shrink-0"
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
    </div>
  );
}
