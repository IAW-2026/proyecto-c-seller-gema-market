"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import {
  MultiImageUpload,
  SingleImageUpload,
} from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { ProductGlyph } from "@/components/ui/product-glyph";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { useActionFeedback } from "@/lib/hooks/use-action-feedback";
import { getProductVisual, PRODUCT_STATUS_OPTIONS } from "@/lib/ui/ui-config";
import { uploadProductImageAction } from "@/lib/actions/products";
import type { Category, Product, ProductCondition, ProductInput, ProductStatus } from "@/types/domain";
import { DeleteProductButton } from "./delete-product-button";

type Mode = "new" | "edit";

type FormState = {
  title: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  weight: string;
  height: string;
  width: string;
  depth: string;
  material: string;
  color: string;
  condition: ProductCondition;
  status: ProductStatus;
  thumbnailUrl: string | null;
  images: ReadonlyArray<string>;
};

function toFormState(product: Product | null, defaultCategoryId: string): FormState {
  return {
    title: product?.title ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    stock: product ? String(product.stock) : "1",
    categoryId: product?.categoryId ?? defaultCategoryId,
    weight: product ? String(product.weight) : "",
    height: product ? String(product.height) : "",
    width: product ? String(product.width) : "",
    depth: product ? String(product.depth) : "",
    material: product?.material ?? "",
    color: product?.color ?? "",
    condition: product?.condition ?? "nuevo",
    status: product?.status ?? "active",
    thumbnailUrl: product?.thumbnailUrl ?? null,
    images: product?.images ?? [],
  };
}

export type ProductEditScreenProps = {
  mode: Mode;
  product: Product | null;
  categories: ReadonlyArray<Category>;
  onSaveAction: (input: ProductInput) => Promise<void>;
};

export function ProductEditScreen({
  mode,
  product,
  categories,
  onSaveAction,
}: ProductEditScreenProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() =>
    toFormState(product, categories[0]?.id ?? ""),
  );
  const save = useActionFeedback();

  const isNew = mode === "new";

  const handleSave = () => {
    save.run(
      () =>
        onSaveAction({
          id: product?.id,
          title: form.title,
          description: form.description,
          price: Number.parseFloat(form.price) || 0,
          currency: "ARS",
          categoryId: form.categoryId,
          stock: Number.parseInt(form.stock, 10) || 0,
          weight: Number.parseFloat(form.weight) || 0,
          height: Number.parseFloat(form.height) || 0,
          width: Number.parseFloat(form.width) || 0,
          depth: Number.parseFloat(form.depth) || 0,
          material: form.material,
          color: form.color,
          condition: form.condition,
          thumbnailUrl: form.thumbnailUrl,
          images: form.images,
          status: form.status,
        }),
      {
        onSuccess: () => {
          if (isNew) router.push("/products");
        },
      },
    );
  };

  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const visual = getProductVisual(selectedCategory?.name);

  const saveLabel = save.isSuccess
    ? isNew
      ? "Publicación creada"
      : "Cambios guardados"
    : save.isPending
      ? "Guardando…"
      : isNew
        ? "Crear publicación"
        : "Guardar cambios";

  return (
    <>
      <PageHeader
        subtitle={isNew ? "Nueva publicación" : "Editar"}
        title={isNew ? "Crear producto" : form.title || "Producto"}
        action={
          <div className="flex gap-2">
            <Button href="/products" variant="secondary">
              Cancelar
            </Button>
            {/*
              El botón Guardar acompaña a Cancelar en la barra fija inferior
              de mobile. En desktop (>= 1100px) se oculta acá y aparece como
              CTA full-width debajo de la card "Estado".
            */}
            <Button
              variant={save.isSuccess ? "success" : "accent"}
              icon="check"
              onClick={handleSave}
              disabled={save.isPending}
              className={`lgx:hidden ${save.isSuccess ? "pointer-events-none" : ""}`}
              aria-live="polite"
            >
              {saveLabel}
            </Button>
          </div>
        }
      />
      {save.error && (
        <div className="mx-4 mt-4 lgx:mx-7 px-4 py-3 rounded-xl bg-danger/10 text-danger text-[13px]">
          {save.error}
        </div>
      )}
      <div className="p-4 pb-32 lgx:px-7 lgx:py-6">
      {/*
        Mobile: flex column con `order` por card para acomodar Datos, Imagen,
        Galería, Precio, Especificaciones, Estado.
        Desktop: dos columnas (flex-row), cada una un flex column independiente.
        Los dos divs internos usan `display: contents` en mobile para que las
        cards sean hijas del flex outer y respeten `order`. Esto evita gaps
        por alturas desparejas que aparecerían con un grid 2x3.
      */}
      <div className="flex flex-col gap-4 min-[901px]:flex-row min-[901px]:items-start">
        <div className="contents min-[901px]:flex min-[901px]:flex-col min-[901px]:gap-4 min-[901px]:flex-1 min-[901px]:min-w-0">
          <Card padding={24} className="order-1 min-[901px]:order-none">
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
                  <Select
                    value={form.categoryId}
                    onChange={(categoryId) => setForm({ ...form, categoryId })}
                    options={categories.map((c) => ({ value: c.id, label: c.name }))}
                    ariaLabel="Categoría"
                  />
                </Field>
                <Field label="Condición">
                  <div className="flex gap-1.5 flex-wrap">
                    {([
                      { value: "nuevo", label: "Nuevo" },
                      { value: "usado", label: "Usado" },
                    ] as const).map((c) => (
                      <Pill
                        key={c.value}
                        active={form.condition === c.value}
                        onClick={() => setForm({ ...form, condition: c.value })}
                        size="lg"
                      >
                        {c.label}
                      </Pill>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          </Card>

          <Card padding={24} className="order-3 min-[901px]:order-none">
            <h3 className="m-0 mb-4 text-[15px] font-semibold">Galería de imágenes</h3>
            <p className="m-0 mb-3 text-[12px] text-ink-3">
              Estas imágenes se muestran como detalle en la app del comprador.
            </p>
            <MultiImageUpload
              values={form.images}
              onChange={(images) => setForm((prev) => ({ ...prev, images }))}
              onUpload={uploadProductImageAction}
              emptyPlaceholders={[0, 1, 2].map((i) => (
                <div
                  key={`ph-${i}`}
                  className="w-full h-full rounded-r2 flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${visual.palette[0]}55, ${visual.palette[1]}55)`,
                  }}
                >
                  <ProductGlyph kind={visual.glyph} palette={visual.palette} size={48} />
                </div>
              ))}
            />
          </Card>

          <Card padding={24} className="order-5 min-[901px]:order-none">
            <h3 className="m-0 mb-4 text-[15px] font-semibold">Especificaciones</h3>
            <div className="grid grid-cols-1 gap-3 min-[600px]:grid-cols-2">
              <Field label="Alto (cm)">
                <Input
                  placeholder="90"
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })}
                />
              </Field>
              <Field label="Ancho (cm)">
                <Input
                  placeholder="180"
                  value={form.width}
                  onChange={(e) => setForm({ ...form, width: e.target.value })}
                />
              </Field>
              <Field label="Profundidad (cm)">
                <Input
                  placeholder="85"
                  value={form.depth}
                  onChange={(e) => setForm({ ...form, depth: e.target.value })}
                />
              </Field>
              <Field label="Peso (kg)">
                <Input
                  placeholder="32"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                />
              </Field>
              <Field label="Material">
                <Input
                  placeholder="Pino macizo + pana"
                  value={form.material}
                  onChange={(e) => setForm({ ...form, material: e.target.value })}
                />
              </Field>
              <Field label="Color">
                <Input
                  placeholder="Verde oliva"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
              </Field>
            </div>
          </Card>
        </div>

        <div className="contents min-[901px]:flex min-[901px]:flex-col min-[901px]:gap-4 min-[901px]:basis-[320px] min-[901px]:max-w-[360px] min-[901px]:shrink-0">
          <Card padding={24} className="order-2 min-[901px]:order-none">
            <h3 className="m-0 mb-3 text-[15px] font-semibold">Imagen principal</h3>
            <p className="m-0 mb-3 text-[12px] text-ink-3">
              Es el thumbnail que aparece como logo de la publicación en el listado.
            </p>
            <SingleImageUpload
              shape="square"
              value={form.thumbnailUrl}
              onChange={(thumbnailUrl) => setForm((prev) => ({ ...prev, thumbnailUrl }))}
              onUpload={uploadProductImageAction}
              alt="Imagen principal de la publicación"
              removable
              fallback={
                <div
                  className="w-full h-full rounded-r2 flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${visual.palette[0]}55, ${visual.palette[1]}55)`,
                  }}
                >
                  <ProductGlyph kind={visual.glyph} palette={visual.palette} size={56} />
                </div>
              }
            />
          </Card>

          <Card padding={24} className="order-4 min-[901px]:order-none">
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
              <Field label="Stock disponible">
                <Input
                  placeholder="1"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </Field>
            </div>
          </Card>

          <Card padding={24} className="order-6 min-[901px]:order-none">
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

          {/*
            CTA de guardado para desktop (>= 1100px). En viewports más chicos
            el mismo botón vive en la barra fija inferior del PageHeader.
          */}
          <Button
            variant={save.isSuccess ? "success" : "accent"}
            icon="check"
            full
            onClick={handleSave}
            disabled={save.isPending}
            className={`hidden lgx:flex ${save.isSuccess ? "pointer-events-none" : ""}`}
            aria-live="polite"
          >
            {saveLabel}
          </Button>
        </div>
      </div>

      {!isNew && product && (
        <Card padding={0} className="mt-6 border-danger/30">
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-danger/10 text-danger inline-flex items-center justify-center shrink-0">
                <Icon name="alert" size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="m-0 text-[15px] font-semibold text-danger">
                  Zona de peligro
                </h3>
                <p className="m-0 mt-1 text-[13px] text-ink-3 leading-relaxed">
                  Eliminar la publicación es permanente. Si solo querés ocultarla,
                  cambiá su estado a “Pausada”.
                </p>
              </div>
            </div>
            <div className="flex justify-center sm:block sm:shrink-0">
              <DeleteProductButton
                productId={product.id}
                productName={product.title}
                variant="full"
                redirectTo="/products"
              />
            </div>
          </div>
        </Card>
      )}
      </div>
    </>
  );
}
