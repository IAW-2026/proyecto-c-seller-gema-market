import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Pill } from "@/components/ui/pill";
import { ProductGlyph } from "@/components/ui/product-glyph";
import { SellerShell } from "@/components/layout/seller-shell";
import type { Product, Seller } from "@/types/domain";

export type StockScreenProps = {
  seller: Seller;
  products: ReadonlyArray<Product>;
};

export function StockScreen({ seller, products }: StockScreenProps) {
  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const activeSkus = products.length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  return (
    <SellerShell
      seller={seller}
      activeNavId="stock"
      subtitle="Inventario"
      title="Gestión de stock"
    >
      <div className="grid gap-3.5 mb-6 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        <Card padding={20}>
          <div className="text-xs text-ink-3">Total unidades</div>
          <div className="text-[26px] font-bold">{totalUnits}</div>
        </Card>
        <Card padding={20}>
          <div className="text-xs text-ink-3">SKUs activos</div>
          <div className="text-[26px] font-bold">{activeSkus}</div>
        </Card>
        <Card padding={20}>
          <div className="text-xs text-ink-3">Sin stock</div>
          <div className="text-[26px] font-bold text-danger">{outOfStock}</div>
        </Card>
      </div>

      <Card padding={0}>
        <div className="p-5 border-b border-line flex justify-between items-center">
          <h3 className="m-0 text-base font-semibold">Inventario por producto</h3>
        </div>
        <div className="overflow-x-auto hidden lgx:block">
          <table className="w-full border-collapse text-[13px] min-w-[760px]">
            <thead className="bg-cream">
              <tr className="text-left text-ink-3 font-mono text-[11px] uppercase tracking-[0.06em]">
                <th className="py-2.5 px-5">SKU</th>
                <th className="py-2.5 px-3">Producto</th>
                <th className="py-2.5 px-3 text-center">Stock</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-5"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const label = p.stock === 0 ? "Sin stock" : "Disponible";
                return (
                  <tr key={p.id} className="border-b border-line">
                    <td className="py-3 px-5 font-mono text-xs">
                      SKU-{p.id.toUpperCase()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-[9px] flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${p.palette[0]}55, ${p.palette[1]}55)`,
                          }}
                        >
                          <ProductGlyph kind={p.glyph} palette={p.palette} size={22} />
                        </div>
                        <span className="font-medium">{p.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-semibold">{p.stock}</td>
                    <td className="py-3 px-3">
                      <Pill tone={p.stock === 0 ? "danger" : "sage"} size="sm">
                        {label}
                      </Pill>
                    </td>
                    <td className="py-3 px-5">
                      <button
                        type="button"
                        aria-label={`Sumar stock de ${p.title}`}
                        className="w-8 h-8 rounded-full bg-bone inline-flex items-center justify-center"
                      >
                        <Icon name="plus" size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 p-3 lgx:hidden">
          {products.map((p) => {
            const label = p.stock === 0 ? "Sin stock" : "Disponible";
            return (
              <div
                key={p.id}
                className="bg-paper border border-line rounded-2xl p-3.5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${p.palette[0]}55, ${p.palette[1]}55)`,
                    }}
                  >
                    <ProductGlyph kind={p.glyph} palette={p.palette} size={30} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{p.title}</div>
                    <div className="text-[11px] text-ink-3 font-mono mt-0.5">
                      SKU-{p.id.toUpperCase()}
                    </div>
                  </div>
                  <Pill tone={p.stock === 0 ? "danger" : "sage"} size="sm">
                    {label}
                  </Pill>
                  <button
                    type="button"
                    aria-label={`Sumar stock de ${p.title}`}
                    className="w-8 h-8 rounded-full bg-bone inline-flex items-center justify-center shrink-0"
                  >
                    <Icon name="plus" size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="bg-cream rounded-xl p-2.5 text-center">
                    <div className="text-[10px] text-ink-3">Stock</div>
                    <div className="text-base font-bold">{p.stock}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </SellerShell>
  );
}
