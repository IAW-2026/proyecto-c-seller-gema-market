import { Card } from "@/components/ui/card";
import { Pager } from "@/components/ui/pager";
import { Pill } from "@/components/ui/pill";
import { ProductGlyph } from "@/components/ui/product-glyph";
import { getProductVisual } from "@/lib/ui/ui-config";
import { StockRowEditor } from "./stock-row-editor";
import type { ProductWithJoins, StockSummary } from "@/types/domain";

export type StockScreenProps = {
  products: ReadonlyArray<ProductWithJoins>;
  page: number;
  pageSize: number;
  total: number;
  summary: StockSummary;
};

export function StockScreen({
  products,
  page,
  pageSize,
  total,
  summary,
}: StockScreenProps) {
  return (
    <>
      <div className="grid gap-2 mb-6 grid-cols-3 lgx:gap-3.5 lgx:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        <Card padding={14}>
          <div className="text-[11px] lgx:text-xs text-ink-3">Total unidades</div>
          <div className="text-[20px] lgx:text-[26px] font-bold">{summary.totalUnits}</div>
        </Card>
        <Card padding={14}>
          <div className="text-[11px] lgx:text-xs text-ink-3">Productos activos</div>
          <div className="text-[20px] lgx:text-[26px] font-bold">{summary.activeSkus}</div>
        </Card>
        <Card padding={14}>
          <div className="text-[11px] lgx:text-xs text-ink-3">Sin stock</div>
          <div className="text-[20px] lgx:text-[26px] font-bold text-danger">{summary.outOfStock}</div>
        </Card>
      </div>

      <Card padding={0}>
        <div className="p-5 border-b border-line flex justify-between items-center">
          <h3 className="m-0 text-base font-semibold">Inventario por producto</h3>
        </div>
        <div className="overflow-x-auto hidden lgx:block">
          <table className="w-full border-collapse text-[13px] min-w-[680px] table-fixed">
            <thead className="bg-cream">
              <tr className="text-left text-ink-3 font-mono text-[11px] uppercase tracking-[0.06em]">
                <th className="py-2.5 px-5">Producto</th>
                <th className="py-2.5 px-3 w-24 text-center">Stock</th>
                <th className="py-2.5 px-3 w-28">Estado</th>
                <th className="py-2.5 px-3 w-[152px]"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const visual = getProductVisual(p.categoryName);
                const isActive = p.status === "active";
                return (
                  <tr key={p.id} className="border-b border-line">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-9 h-9 rounded-[9px] flex items-center justify-center shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${visual.palette[0]}55, ${visual.palette[1]}55)`,
                          }}
                        >
                          <ProductGlyph kind={visual.glyph} palette={visual.palette} size={22} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.title}</div>
                          <div className="text-[11px] text-ink-3">{p.categoryName}</div>
                        </div>
                      </div>
                    </td>
                    <td className={`py-3 px-3 text-center font-semibold ${p.stock === 0 ? "text-danger" : ""}`}>
                      {p.stock}
                    </td>
                    <td className="py-3 px-3">
                      <Pill tone={isActive ? "sage" : "warn"} size="sm">
                        {isActive ? "Activo" : "Pausado"}
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
                  <td colSpan={4} className="py-12 px-5 text-center text-ink-3">
                    No hay productos que coincidan con tu búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 p-3 lgx:hidden">
          {products.map((p) => {
            const visual = getProductVisual(p.categoryName);
            const isActive = p.status === "active";
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
                    <div className="text-sm font-semibold truncate">{p.title}</div>
                    <div className="text-[11px] text-ink-3 mt-0.5">{p.categoryName}</div>
                  </div>
                  <Pill tone={isActive ? "sage" : "warn"} size="sm">
                    {isActive ? "Activo" : "Pausado"}
                  </Pill>
                </div>
                <div className="flex items-center justify-between bg-cream rounded-xl p-2.5">
                  <div>
                    <div className="text-[10px] text-ink-3">Stock</div>
                    <div className={`text-base font-bold ${p.stock === 0 ? "text-danger" : ""}`}>
                      {p.stock}
                    </div>
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
    </>
  );
}
