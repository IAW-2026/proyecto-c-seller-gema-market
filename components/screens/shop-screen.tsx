import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { SellerShell } from "@/components/layout/seller-shell";
import type { Seller } from "@/types/domain";

export type ShopScreenProps = {
  seller: Seller;
};

export function ShopScreen({ seller }: ShopScreenProps) {
  const stats = [
    { label: "Productos", value: String(seller.productsCount) },
    { label: "Ventas", value: String(seller.salesCount) },
  ] as const;

  return (
    <SellerShell
      seller={seller}
      activeNavId="shop"
      subtitle="Pública"
      title="Perfil de tienda"
      action={
        <Button variant="accent" icon="check">
          Guardar cambios
        </Button>
      }
    >
      <Card padding={0} className="mb-4 overflow-hidden">
        <div className="h-40 max-[560px]:h-[132px] bg-gradient-to-br from-clay to-bark relative">
          <button
            type="button"
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-paper/95 text-xs font-medium inline-flex items-center gap-1.5"
          >
            <Icon name="camera" size={14} /> Cambiar portada
          </button>
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-center gap-4 mb-5 max-[560px]:items-start max-[560px]:gap-3">
            <div className="w-[88px] h-[88px] rounded-full bg-paper border-4 border-paper flex items-center justify-center text-cocoa -mt-11 shrink-0 shadow-sh-1 relative z-[1]">
              <Icon name="tag" size={36} />
            </div>
            <div className="flex-1 pt-3 min-w-0">
              <h2 className="m-0 text-[22px] font-semibold max-[560px]:text-[19px]">
                {seller.name}
              </h2>
              <div className="text-[13px] text-ink-3 flex gap-2.5 items-center mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Icon name="pin" size={12} /> {seller.city}
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

      <div className="grid gap-4 grid-cols-1 min-[901px]:grid-cols-2">
        <Card padding={24}>
          <h3 className="m-0 mb-4 text-[15px] font-semibold">Información pública</h3>
          <div className="flex flex-col gap-3.5">
            <Field label="Nombre de la tienda">
              <Input defaultValue={seller.name} readOnly />
            </Field>
            <Field label="Bio">
              <textarea
                rows={3}
                defaultValue={seller.bio}
                className="w-full border border-line-2 rounded-r2 p-3.5 text-sm font-sans"
              />
            </Field>
          </div>
        </Card>
        <Card padding={24}>
          <h3 className="m-0 mb-4 text-[15px] font-semibold">Contacto y operación</h3>
          <div className="flex flex-col gap-3.5">
            <Field label="Email">
              <Input icon="mail" defaultValue={seller.email} />
            </Field>
            <Field label="WhatsApp">
              <Input icon="phone" defaultValue={seller.phone} />
            </Field>
          </div>
        </Card>
        <Card padding={24} className="col-span-full">
          <h3 className="m-0 mb-4 text-[15px] font-semibold">Dirección de la tienda</h3>
          <div className="grid gap-3.5 grid-cols-1 min-[521px]:grid-cols-2 min-[901px]:grid-cols-[2fr_1fr_1fr_1fr]">
            <Field label="Dirección">
              <Input icon="pin" defaultValue={seller.address.street} />
            </Field>
            <Field label="Número">
              <Input defaultValue={seller.address.number} />
            </Field>
            <Field label="Depto" optional>
              <Input
                placeholder="-"
                defaultValue={seller.address.apartment ?? ""}
              />
            </Field>
            <Field label="Código postal">
              <Input defaultValue={seller.address.postalCode} />
            </Field>
          </div>
        </Card>
      </div>
    </SellerShell>
  );
}
