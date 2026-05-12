"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { ProductGlyph } from "@/components/ui/product-glyph";
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setIsUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("file", file);
        const url = await uploadProductImageAction(fd);
        uploaded.push(url);
      }
      setForm((prev) => ({ ...prev, images: [...prev.images, ...uploaded] }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const visual = getProductVisual(selectedCategory?.name);

  const saveLabel = save.isSuccess
    ? isNew
      ? "Publicación creada"
      : "Cambios guardados"
    : save.isPending
      ? "Guardando…"
      : "Guardar";

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
            <Button
              variant={save.isSuccess ? "success" : "accent"}
              icon="check"
              onClick={handleSave}
              disabled={save.isPending}
              className={save.isSuccess ? "pointer-events-none" : ""}
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
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
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

          <Card padding={24}>
            <h3 className="m-0 mb-4 text-[15px] font-semibold">Imágenes</h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5">
              <label
                className={`aspect-square border-2 border-dashed border-line-2 rounded-r2 flex flex-col items-center justify-center text-ink-3 bg-cream ${isUploading ? "opacity-60 cursor-progress" : "cursor-pointer"}`}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  disabled={isUploading}
                  onChange={(e) => {
                    handleUpload(e.target.files);
                    e.target.value = "";
                  }}
                />
                <Icon name="upload" size={20} />
                <span className="text-[11px] mt-1.5">
                  {isUploading ? "Subiendo…" : "Subir"}
                </span>
              </label>
              {form.images.length === 0
                ? [0, 1, 2].map((i) => (
                    <div
                      key={`placeholder-${i}`}
                      className="aspect-square rounded-r2 flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${visual.palette[0]}55, ${visual.palette[1]}55)`,
                      }}
                    >
                      <ProductGlyph kind={visual.glyph} palette={visual.palette} size={48} />
                    </div>
                  ))
                : form.images.map((url, i) => (
                    <div
                      key={`${url}-${i}`}
                      className="aspect-square rounded-r2 relative overflow-hidden bg-cream"
                    >
                      {/* unoptimized: origin URL is user-supplied and unknown at build time */}
                      <Image
                        fill
                        unoptimized
                        src={url}
                        alt={`Imagen ${i + 1}`}
                        className="object-cover"
                      />
                      <button
                        type="button"
                        aria-label="Quitar imagen"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-paper/90 flex items-center justify-center"
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </div>
                  ))}
            </div>
            {uploadError && (
              <div className="mt-2 text-[12px] text-danger">{uploadError}</div>
            )}
          </Card>

          <Card padding={24}>
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
