"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { SellerShell } from "@/components/layout/seller-shell";
import type { Seller, SellerInput } from "@/types/domain";

export type ShopScreenProps = {
  seller: Seller;
  onSaveAction: (input: SellerInput) => Promise<void>;
  onUploadCoverAction: (formData: FormData) => Promise<string>;
};

type FormState = {
  name: string;
  city: string;
  bio: string;
  email: string;
  phone: string;
  street: string;
  number: string;
  apartment: string;
  postalCode: string;
};

function toFormState(seller: Seller): FormState {
  return {
    name: seller.name,
    city: seller.city,
    bio: seller.bio,
    email: seller.email,
    phone: seller.phone,
    street: seller.address.street,
    number: seller.address.number,
    apartment: seller.address.apartment ?? "",
    postalCode: seller.address.postalCode,
  };
}

function toSellerInput(form: FormState): SellerInput {
  return {
    name: form.name,
    city: form.city,
    bio: form.bio,
    email: form.email,
    phone: form.phone,
    address: {
      street: form.street,
      number: form.number,
      apartment: form.apartment.trim() || undefined,
      postalCode: form.postalCode,
    },
  };
}

export function ShopScreen({
  seller,
  onSaveAction,
  onUploadCoverAction,
}: ShopScreenProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(seller));
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stats = [
    { label: "Productos", value: String(seller.productsCount) },
    { label: "Ventas", value: String(seller.salesCount) },
  ] as const;

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      try {
        await onSaveAction(toSellerInput(form));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  };

  const handleCoverChange = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setIsUploadingCover(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const url = await onUploadCoverAction(fd);
      setCoverUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir portada");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <SellerShell
      seller={seller}
      activeNavId="shop"
      subtitle="Pública"
      title="Perfil de tienda"
      action={
        <Button
          variant="accent"
          icon="check"
          onClick={handleSave}
          disabled={isPending}
        >
          {isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      }
    >
      <Card padding={0} className="mb-4 overflow-hidden">
        <div
          className="h-40 max-[560px]:h-[132px] bg-gradient-to-br from-clay to-bark relative"
          style={
            coverUrl
              ? {
                  backgroundImage: `url(${coverUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          <label
            className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-paper/95 text-xs font-medium inline-flex items-center gap-1.5 ${isUploadingCover ? "opacity-60 cursor-progress" : "cursor-pointer"}`}
          >
            <input
              type="file"
              accept="image/*"
              hidden
              disabled={isUploadingCover}
              onChange={(e) => {
                handleCoverChange(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Icon name="camera" size={14} />
            {isUploadingCover ? "Subiendo…" : "Cambiar portada"}
          </label>
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-center gap-4 mb-5 max-[560px]:items-start max-[560px]:gap-3">
            <div className="w-[88px] h-[88px] rounded-full bg-paper border-4 border-paper flex items-center justify-center text-cocoa -mt-11 shrink-0 shadow-sh-1 relative z-[1]">
              <Icon name="tag" size={36} />
            </div>
            <div className="flex-1 pt-3 min-w-0">
              <h2 className="m-0 text-[22px] font-semibold max-[560px]:text-[19px]">
                {form.name || seller.name}
              </h2>
              <div className="text-[13px] text-ink-3 flex gap-2.5 items-center mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Icon name="pin" size={12} /> {form.city || seller.city}
                </span>
              </div>
            </div>
          </div>
          <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(130px,1fr))]">
            {stats.map((s) => (
              <div key={s.label} className="p-3 bg-cream rounded-r2">
                <div className="text-[11px] text-ink-3">{s.label}</div>
                <div className="text-xl font-bold">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {error && (
        <div className="mb-4 p-3 rounded-r2 bg-danger/10 text-danger text-[13px]">
          {error}
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 min-[901px]:grid-cols-2">
        <Card padding={24}>
          <h3 className="m-0 mb-4 text-[15px] font-semibold">Información pública</h3>
          <div className="flex flex-col gap-3.5">
            <Field label="Nombre de la tienda">
              <Input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </Field>
            <Field label="Bio">
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                className="w-full border border-line-2 rounded-r2 p-3.5 text-sm font-sans"
              />
            </Field>
          </div>
        </Card>
        <Card padding={24}>
          <h3 className="m-0 mb-4 text-[15px] font-semibold">Contacto y operación</h3>
          <div className="flex flex-col gap-3.5">
            <Field label="Email">
              <Input
                icon="mail"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </Field>
            <Field label="WhatsApp">
              <Input
                icon="phone"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </Field>
          </div>
        </Card>
        <Card padding={24} className="col-span-full">
          <h3 className="m-0 mb-4 text-[15px] font-semibold">Dirección de la tienda</h3>
          <div className="grid gap-3.5 grid-cols-1 min-[521px]:grid-cols-2 min-[901px]:grid-cols-[2fr_2fr_1fr_1fr_1fr]">
            <Field label="Ciudad">
              <Input
                icon="pin"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </Field>
            <Field label="Dirección">
              <Input
                icon="pin"
                value={form.street}
                onChange={(e) => updateField("street", e.target.value)}
              />
            </Field>
            <Field label="Número">
              <Input
                value={form.number}
                onChange={(e) => updateField("number", e.target.value)}
              />
            </Field>
            <Field label="Depto" optional>
              <Input
                placeholder="-"
                value={form.apartment}
                onChange={(e) => updateField("apartment", e.target.value)}
              />
            </Field>
            <Field label="Código postal">
              <Input
                value={form.postalCode}
                onChange={(e) => updateField("postalCode", e.target.value)}
              />
            </Field>
          </div>
        </Card>
      </div>
    </SellerShell>
  );
}
