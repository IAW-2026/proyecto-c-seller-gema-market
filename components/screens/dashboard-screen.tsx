import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { ProductGlyph } from "@/components/ui/product-glyph";
import { getProductVisual, ORDER_STATUS_META } from "@/lib/ui/ui-config";
import { fmtARS, fmtOrderDate } from "@/lib/ui/format";
import type {
  DashboardStat,
  DashboardStatId,
  OrderWithJoins,
  ProductWithJoins,
} from "@/types/domain";

const DASHBOARD_STAT_META: Readonly<
  Record<DashboardStatId, { label: string; valueFormat: "currency" | "number" }>
> = {
  monthlySales: { label: "Ventas (últimos 30 días)", valueFormat: "currency" },
  orders: { label: "Pedidos (últimos 30 días)", valueFormat: "number" },
  activeProducts: { label: "Productos activos", valueFormat: "number" },
};

function formatDashboardValue(stat: DashboardStat): string {
  const meta = DASHBOARD_STAT_META[stat.id];
  return meta.valueFormat === "currency" ? fmtARS(stat.value) : String(stat.value);
}

export type DashboardScreenProps = {
  stats: ReadonlyArray<DashboardStat>;
  topProducts: ReadonlyArray<ProductWithJoins>;
  recentOrders: ReadonlyArray<OrderWithJoins>;
};

export function DashboardScreen({
  stats,
  topProducts,
  recentOrders,
}: DashboardScreenProps) {
  return (
    <div className="p-4 pb-32 lgx:px-7 lgx:py-6">
      <div className="grid gap-3.5 mb-6 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {stats.map((s) => (
          <Card key={s.id} padding={20}>
            <div className="text-xs text-ink-3 mb-2">{DASHBOARD_STAT_META[s.id].label}</div>
            <div className="text-[26px] font-bold tracking-[-0.02em]">
              {formatDashboardValue(s)}
            </div>
          </Card>
        ))}
      </div>

      <Card padding={24} className="mb-6">
        <h3 className="m-0 mb-4 text-base font-semibold">Top productos</h3>
        <div className="flex flex-col">
          {topProducts.map((p, i) => {
            const visual = getProductVisual(p.categoryName);
            const stockTone = p.stock === 0 ? "danger" : p.stock < 5 ? "warn" : "sage";
            return (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className={`flex items-center gap-3 py-3 ${i < topProducts.length - 1 ? "border-b border-line" : ""}`}
              >
                <div className="w-5 font-mono text-[11px] text-ink-3 shrink-0 text-center">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${visual.palette[0]}55, ${visual.palette[1]}55)`,
                  }}
                >
                  <ProductGlyph kind={visual.glyph} palette={visual.palette} size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                    {p.title}
                  </div>
                  <div className="text-[11px] text-ink-3">{p.categoryName}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[12px] font-semibold tabular-nums">
                    {p.salesCount} <span className="text-ink-3 font-normal">{p.salesCount === 1 ? "venta" : "ventas"}</span>
                  </span>
                  <Pill tone={stockTone} size="sm">
                    {p.stock === 0 ? "Sin stock" : `${p.stock} en stock`}
                  </Pill>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>

      <Card padding={0}>
        <div className="p-5 flex justify-between items-center border-b border-line">
          <h3 className="m-0 text-base font-semibold">Últimos pedidos</h3>
          <Button href="/orders" size="sm" variant="ghost" iconRight="arrowRight">
            Ver todos
          </Button>
        </div>
        <div className="overflow-x-auto hidden lgx:block">
          <table className="w-full border-collapse text-[13px] min-w-[640px] table-fixed">
            <thead className="bg-cream">
              <tr className="text-left text-ink-3 font-mono text-[11px] uppercase tracking-[0.06em]">
                <th className="py-2.5 px-5">Producto</th>
                <th className="py-2.5 px-3 w-44">Comprador</th>
                <th className="py-2.5 px-3 w-32">Fecha</th>
                <th className="py-2.5 px-3 w-32">Estado</th>
                <th className="py-2.5 px-5 w-32 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => {
                const st = ORDER_STATUS_META[o.status];
                return (
                  <tr key={o.id} className="border-b border-line">
                    <td className="py-3 px-5">
                      <Link href={`/orders/${o.id}`} className="block">
                        <div className="font-medium truncate">{o.productTitle}</div>
                        <div className="text-[11px] text-ink-3">{o.amount} {o.amount === 1 ? "unidad" : "unidades"}</div>
                      </Link>
                    </td>
                    <td className="py-3 px-3">
                      <Link
                        href={`/orders/${o.id}`}
                        className="flex items-center gap-2 min-w-0"
                      >
                        <Avatar name={o.buyerId} size={28} />
                        <span className="truncate">{o.buyerId}</span>
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-ink-3">{fmtOrderDate(o.createdAt)}</td>
                    <td className="py-3 px-3">
                      <Pill tone={st.tone} size="sm">
                        {st.label}
                      </Pill>
                    </td>
                    <td className="py-3 px-5 font-semibold text-right">
                      {fmtARS(o.total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 p-3 lgx:hidden">
          {recentOrders.map((o) => {
            const st = ORDER_STATUS_META[o.status];
            return (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="w-full text-left bg-paper border border-line rounded-2xl p-3.5 block"
              >
                <div className="flex justify-between gap-2.5 items-start mb-2.5">
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold truncate">
                      {o.productTitle}
                    </div>
                    <div className="text-[11px] text-ink-3 mt-[3px]">
                      {o.buyerId} · {o.amount} {o.amount === 1 ? "unidad" : "unidades"}
                    </div>
                  </div>
                  <Pill tone={st.tone} size="sm">
                    {st.label}
                  </Pill>
                </div>
                <div className="flex justify-between items-center text-ink-3 text-xs">
                  <span>{fmtOrderDate(o.createdAt)}</span>
                  <strong className="text-ink text-sm">{fmtARS(o.total)}</strong>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
