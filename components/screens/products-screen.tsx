import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Pager } from "@/components/ui/pager";
import { Pill } from "@/components/ui/pill";
import { ProductGlyph } from "@/components/ui/product-glyph";
import type { TabItem } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { fmtARS } from "@/lib/ui/format";
import { getProductVisual } from "@/lib/ui/ui-config";
import type { Product } from "@/types/domain";
import { ProductsToolbar } from "./products-toolbar";

export type ProductsScreenProps = {
  products: ReadonlyArray<Product>;
  page: number;
  pageSize: number;
  total: number;
  query: string;
  activeTab: string;
  counts: { active: number; paused: number };
};

export function ProductsScreen({
  products,
  page,
  pageSize,
  total,
  query,
  activeTab,
  counts,
}: ProductsScreenProps) {
  const tabs: ReadonlyArray<TabItem> = [
    { id: "active", label: "Activas", count: counts.active },
    { id: "paused", label: "Pausadas", count: counts.paused },
  ];

  return (
    <>
      <PageHeader
        subtitle="Catálogo"
        title="Publicaciones"
        action={
          <Button href="/products/new" variant="accent" icon="plus">
            Nueva
          </Button>
        }
      />
      <div className="p-4 pb-32 lgx:px-7 lgx:py-6">
      <ProductsToolbar
        initialQuery={query}
        activeTab={activeTab}
        tabs={tabs}
      />
      <div className="mt-4">
        <Card padding={0}>
          <div className="overflow-x-auto hidden lgx:block">
            <table className="w-full border-collapse text-[13px] min-w-[640px]">
              <thead className="bg-cream">
                <tr className="text-left text-ink-3 font-mono text-[11px] uppercase tracking-[0.06em]">
                  <th className="py-2.5 px-5">Producto</th>
                  <th className="py-2.5 px-3">Precio</th>
                  <th className="py-2.5 px-3">Stock</th>
                  <th className="py-2.5 px-3">Ventas</th>
                  <th className="py-2.5 px-5"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const visual = getProductVisual(p);
                  return (
                  <tr key={p.id} className="border-b border-line">
                    <td className="py-3 px-5">
                      <Link
                        href={`/products/${p.id}`}
                        className="flex items-center gap-3"
                      >
                        <div
                          className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${visual.palette[0]}55, ${visual.palette[1]}55)`,
                          }}
                        >
                          <ProductGlyph kind={visual.glyph} palette={visual.palette} size={28} />
                        </div>
                        <div>
                          <div className="font-medium">{p.title}</div>
                          <div className="text-[11px] text-ink-3 font-mono">
                            {p.id.toUpperCase()}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 px-3 font-semibold">{fmtARS(p.price)}</td>
                    <td className="py-3 px-3">
                      <Pill size="sm" tone={p.stock < 5 ? "warn" : "sage"}>
                        {p.stock}
                      </Pill>
                    </td>
                    <td className="py-3 px-3 text-ink-3">{p.salesCount}</td>
                    <td className="py-3 px-5">
                      <Link
                        href={`/products/${p.id}`}
                        className="w-8 h-8 rounded-full bg-bone inline-flex items-center justify-center"
                        aria-label={`Editar ${p.title}`}
                      >
                        <Icon name="edit" size={14} />
                      </Link>
                    </td>
                  </tr>
                  );
                })}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 px-5 text-center text-ink-3">
                      No hay publicaciones que coincidan con tu búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-3 lgx:hidden">
            {products.map((p) => {
              const visual = getProductVisual(p);
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="w-full text-left bg-paper border border-line rounded-2xl p-3 block"
                >
                <div className="flex gap-3 items-center">
                  <div
                    className="w-[52px] h-[52px] rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${visual.palette[0]}55, ${visual.palette[1]}55)`,
                    }}
                  >
                    <ProductGlyph kind={visual.glyph} palette={visual.palette} size={32} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold leading-[1.25]">
                      {p.title}
                    </div>
                    <div className="text-[11px] text-ink-3 font-mono mt-[3px]">
                      {p.id.toUpperCase()}
                    </div>
                  </div>
                  <Icon name="chevronRight" size={16} className="text-ink-3 shrink-0" />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="bg-cream rounded-xl p-2.5">
                    <div className="text-[10px] text-ink-3">Precio</div>
                    <div className="text-[13px] font-bold">{fmtARS(p.price)}</div>
                  </div>
                  <div className="bg-cream rounded-xl p-2.5">
                    <div className="text-[10px] text-ink-3">Stock</div>
                    <Pill size="sm" tone={p.stock < 5 ? "warn" : "sage"}>
                      {p.stock}
                    </Pill>
                  </div>
                  <div className="bg-cream rounded-xl p-2.5">
                    <div className="text-[10px] text-ink-3">Ventas</div>
                    <div className="text-[13px] font-bold">{p.salesCount}</div>
                  </div>
                </div>
                </Link>
              );
            })}
            {products.length === 0 && (
              <div className="text-center text-ink-3 py-10 text-sm">
                No hay publicaciones que coincidan con tu búsqueda.
              </div>
            )}
          </div>
          <Pager page={page} pageSize={pageSize} total={total} basePath="/products" />
        </Card>
      </div>
      </div>
    </>
  );
}
