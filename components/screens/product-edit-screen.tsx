"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { ProductGlyph } from "@/components/ui/product-glyph";
import { SellerShell } from "@/components/layout/seller-shell";
import { PRODUCT_STATUS_OPTIONS } from "@/lib/data/status";
import type { Category, Product, Seller } from "@/types/domain";

type Mode = "new" | "edit";

type FormState = {
  title: string;
  price: string;
  stock: string;
  description: string;
  category: string;
  condition: "Nuevo" | "Usado";
  dims: string;
  status: Product["status"];
};

function toFormState(product: Product | null): FormState {
  return {
    title: product?.title ?? "",
    price: product ? String(product.price) : "",
    stock: product ? String(product.stock) : "1",
    description:
      "Pieza ideal para departamentos pequeños y luminosos. Material noble, traída desde el taller.",
    category: product?.category ?? "living",
    condition: product?.condition.startsWith("Usado") ? "Usado" : "Nuevo",
    dims: product?.dims ?? "",
    status: product?.status ?? "active",
  };
}

export type ProductEditScreenProps = {
  seller: Seller;
  mode: Mode;
  product: Product | null;
  categories: ReadonlyArray<Category>;
};

const FALLBACK_PALETTE: Product["palette"] = ["#a4ac86", "#414833"];

export function ProductEditScreen({
  seller,
  mode,
  product,
  categories,
}: ProductEditScreenProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(product));

  const isNew = mode === "new";
  const palette = product?.palette ?? FALLBACK_PALETTE;
  const glyph = product?.glyph ?? "box";

  return (
    <SellerShell
      seller={seller}
      activeNavId="products"
      subtitle={isNew ? "Nueva publicación" : "Editar"}
      title={isNew ? "Crear producto" : form.title || "Producto"}
      action={
        <div className="flex gap-2">
          <Button href="/products" variant="secondary">
            Cancelar
          </Button>
          <Button variant="accent" icon="check">
            Guardar
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 grid-cols-1 min-[901px]:grid-cols-[1fr_minmax(280px,360px)]">
        <div className="flex flex-col gap-4">
          <Card padding={24}>
            <h3 className="m-0 mb-4 text-[15px] font-semibold">Datos básicos</h3>
            <div className="flex flex-col gap-3.5">
              <Field label="Título">
                <Input
                  placeholder="Ej. Sillón de pana 2 cuerpos"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </Field>
              <Field label="Descripción">
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full resize-y border border-line-2 rounded-r2 p-3.5 text-sm font-sans bg-paper"
                />
              </Field>
              <div className="grid grid-cols-1 gap-3 min-[600px]:grid-cols-2">
                <Field label="Categoría">
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full h-[46px] border border-line-2 rounded-r2 px-3.5 bg-paper"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Condición">
                  <div className="flex gap-1.5 flex-wrap">
                    {(["Nuevo", "Usado"] as const).map((c) => (
                      <Pill
                        key={c}
                        active={form.condition === c}
                        onClick={() => setForm({ ...form, condition: c })}
                        size="lg"
                      >
                        {c}
                      </Pill>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          </Card>

          <Card padding={24}>
            <h3 className="m-0 mb-4 text-[15px] font-semibold">Imágenes</h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5">
              <div className="aspect-square border-2 border-dashed border-line-2 rounded-r2 flex flex-col items-center justify-center text-ink-3 cursor-pointer bg-cream">
                <Icon name="upload" size={20} />
                <span className="text-[11px] mt-1.5">Subir</span>
              </div>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-r2 flex items-center justify-center relative"
                  style={{
                    background: `linear-gradient(135deg, ${palette[0]}55, ${palette[1]}55)`,
                  }}
                >
                  <ProductGlyph kind={glyph} palette={palette} size={48} />
                  <button
                    type="button"
                    aria-label="Quitar imagen"
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-paper/90 flex items-center justify-center"
                  >
                    <Icon name="close" size={12} />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Card padding={24}>
            <h3 className="m-0 mb-4 text-[15px] font-semibold">Especificaciones</h3>
            <div className="grid grid-cols-1 gap-3 min-[600px]:grid-cols-2">
              <Field label="Dimensiones">
                <Input
                  placeholder="180 × 85 × 90 cm"
                  value={form.dims}
                  onChange={(e) => setForm({ ...form, dims: e.target.value })}
                />
              </Field>
              <Field label="Peso (kg)">
                <Input placeholder="32" />
              </Field>
              <Field label="Material">
                <Input placeholder="Pino macizo + pana" />
              </Field>
              <Field label="Color">
                <Input placeholder="Verde oliva" />
              </Field>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card padding={24}>
            <h3 className="m-0 mb-4 text-[15px] font-semibold">Precio y stock</h3>
            <div className="flex flex-col gap-3.5">
              <Field label="Precio (ARS)">
                <Input
                  suffix="ARS"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </Field>
              <Field label="Precio anterior" optional hint="Mostrar descuento">
                <Input suffix="ARS" placeholder="0" />
              </Field>
              <Field label="Stock disponible">
                <Input
                  placeholder="1"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </Field>
            </div>
          </Card>

          <Card padding={24}>
            <h3 className="m-0 mb-4 text-[15px] font-semibold">Estado</h3>
            <div className="flex flex-col gap-2">
              {PRODUCT_STATUS_OPTIONS.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer ${form.status === s.id ? "bg-bone" : "bg-transparent"}`}
                >
                  <input
                    type="radio"
                    name="status"
                    checked={form.status === s.id}
                    onChange={() => setForm({ ...form, status: s.id })}
                    className="[accent-color:#7f4f24]"
                  />
                  <div>
                    <div className="text-[13px] font-medium">{s.label}</div>
                    <div className="text-[11px] text-ink-3">{s.body}</div>
                  </div>
                </label>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </SellerShell>
  );
}
