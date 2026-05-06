import { Card } from "@/components/ui/card";
import { Pager } from "@/components/ui/pager";
import { Pill } from "@/components/ui/pill";
import { ProductGlyph } from "@/components/ui/product-glyph";
import { PageHeader } from "@/components/layout/page-header";
import { getProductVisual } from "@/lib/ui/ui-config";
import { StockRowEditor } from "./stock-row-editor";
import { StockToolbar } from "./stock-toolbar";
import type { ProductWithJoins, StockSummary } from "@/types/domain";

export type StockScreenProps = {
  products: ReadonlyArray<ProductWithJoins>;
  page: number;
  pageSize: number;
  total: number;
  query: string;
  summary: StockSummary;
};

export function StockScreen({
  products,
  page,
  pageSize,
  total,
  query,
  summary,
}: StockScreenProps) {
  return (
    <>
      <PageHeader subtitle="Inventario" title="Gestión de stock" />
      <div className="p-4 pb-16 lgx:px-7 lgx:py-6">
      <div className="grid gap-3.5 mb-6 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        <Card padding={20}>
          <div className="text-xs text-ink-3">Total unidades</div>
          <div className="text-[26px] font-bold">{summary.totalUnits}</div>
        </Card>
        <Card padding={20}>
          <div className="text-xs text-ink-3">Productos activos</div>
          <div className="text-[26px] font-bold">{summary.activeSkus}</div>
        </Card>
        <Card padding={20}>
          <div className="text-xs text-ink-3">Sin stock</div>
          <div className="text-[26px] font-bold text-danger">{summary.outOfStock}</div>
        </Card>
      </div>

      <StockToolbar initialQuery={query} />

      <Card padding={0}>
        <div className="p-5 border-b border-line flex justify-between items-center">
          <h3 className="m-0 text-base font-semibold">Inventario por producto</h3>
        </div>
        <div className="overflow-x-auto hidden lgx:block">
          <table className="w-full border-collapse text-[13px] min-w-[760px] table-fixed">
            <thead className="bg-cream">
              <tr className="text-left text-ink-3 font-mono text-[11px] uppercase tracking-[0.06em]">
                <th className="py-2.5 px-5 w-28">ID</th>
                <th className="py-2.5 px-3">Producto</th>
                <th className="py-2.5 px-3 w-20 text-center">Stock</th>
                <th className="py-2.5 px-3 w-28">Estado</th>
                <th className="py-2.5 px-3 w-[152px]"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const label = p.stock === 0 ? "Sin stock" : "Disponible";
                const visual = getProductVisual(p.categoryName);
                return (
                  <tr key={p.id} className="border-b border-line">
                    <td className="py-3 px-5 font-mono text-xs">
                      {p.id.toUpperCase()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-[9px] flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${visual.palette[0]}55, ${visual.palette[1]}55)`,
                          }}
                        >
                          <ProductGlyph kind={visual.glyph} palette={visual.palette} size={22} />
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
                    <td className="py-3 px-3">
                      <StockRowEditor productId={p.id} initialStock={p.stock} productName={p.title} />
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 px-5 text-center text-ink-3">
                    No hay productos que coincidan con tu búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 p-3 lgx:hidden">
          {products.map((p) => {
            const label = p.stock === 0 ? "Sin stock" : "Disponible";
            const visual = getProductVisual(p.categoryName);
            return (
              <div
                key={p.id}
                className="bg-paper border border-line rounded-2xl p-3.5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${visual.palette[0]}55, ${visual.palette[1]}55)`,
                    }}
                  >
                    <ProductGlyph kind={visual.glyph} palette={visual.palette} size={30} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{p.title}</div>
                    <div className="text-[11px] text-ink-3 font-mono mt-0.5">
                      {p.id.toUpperCase()}
                    </div>
                  </div>
                  <Pill tone={p.stock === 0 ? "danger" : "sage"} size="sm">
                    {label}
                  </Pill>
                </div>
                <div className="flex items-center justify-between bg-cream rounded-xl p-2.5">
                  <div>
                    <div className="text-[10px] text-ink-3">Stock</div>
                    <div className="text-base font-bold">{p.stock}</div>
                  </div>
                  <StockRowEditor productId={p.id} initialStock={p.stock} productName={p.title} />
                </div>
              </div>
            );
          })}
          {products.length === 0 && (
            <div className="text-center text-ink-3 py-10 text-sm">
              No hay productos que coincidan con tu búsqueda.
            </div>
          )}
        </div>
        <Pager page={page} pageSize={pageSize} total={total} basePath="/stock" />
      </Card>
      </div>
    </>
  );
}
