import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Pill } from "@/components/ui/pill";
import { ProductGlyph } from "@/components/ui/product-glyph";
import { SellerShell } from "@/components/layout/seller-shell";
import { getProductVisual, ORDER_STATUS_META } from "@/lib/ui-config";
import { fmtARS } from "@/lib/format";
import type { DashboardStat, DashboardStatId, Order, Product, Seller } from "@/types/domain";

const DASHBOARD_STAT_META: Readonly<
  Record<DashboardStatId, { label: string; valueFormat: "currency" | "number"; deltaFormat: "percent" | "number" | "none" }>
> = {
  monthlySales: { label: "Ventas del mes", valueFormat: "currency", deltaFormat: "percent" },
  orders: { label: "Pedidos", valueFormat: "number", deltaFormat: "number" },
  activeProducts: { label: "Productos activos", valueFormat: "number", deltaFormat: "none" },
};

function formatDashboardValue(stat: DashboardStat): string {
  const meta = DASHBOARD_STAT_META[stat.id];
  return meta.valueFormat === "currency" ? fmtARS(stat.value) : String(stat.value);
}

function formatDashboardDelta(stat: DashboardStat): string {
  const meta = DASHBOARD_STAT_META[stat.id];
  if (stat.delta === null || meta.deltaFormat === "none") return "-";
  const sign = stat.delta > 0 ? "+" : "";
  return meta.deltaFormat === "percent"
    ? `${sign}${stat.delta}%`
    : `${sign}${stat.delta}`;
}

export type DashboardScreenProps = {
  seller: Seller;
  stats: ReadonlyArray<DashboardStat>;
  topProducts: ReadonlyArray<Product>;
  recentOrders: ReadonlyArray<Order>;
};

export function DashboardScreen({
  seller,
  stats,
  topProducts,
  recentOrders,
}: DashboardScreenProps) {
  return (
    <SellerShell
      seller={seller}
      activeNavId="dashboard"
      subtitle="Resumen"
      title={`Hola, ${seller.name}`}
      action={
        <Button href="/products/new" variant="accent" icon="plus">
          Nueva publicación
        </Button>
      }
    >
      <div className="grid gap-3.5 mb-6 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {stats.map((s) => (
          <Card key={s.id} padding={20}>
            <div className="text-xs text-ink-3 mb-2">{DASHBOARD_STAT_META[s.id].label}</div>
            <div className="text-[26px] font-bold tracking-[-0.02em] mb-2">
              {formatDashboardValue(s)}
            </div>
            <div
              className={`inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[11px] font-semibold ${s.trend === "up" ? "bg-[#d8e3c8] text-success" : "bg-bone text-ink-3"}`}
            >
              {s.trend === "up" && <Icon name="arrowUp" size={11} />}
              {formatDashboardDelta(s)}
            </div>
          </Card>
        ))}
      </div>

      <Card padding={24} className="mb-6">
        <h3 className="m-0 mb-4 text-base font-semibold">Top productos</h3>
        <div className="flex flex-col">
          {topProducts.map((p, i) => {
            const visual = getProductVisual(p);
            return (
              <div
                key={p.id}
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
                  <div className="text-[11px] text-ink-3">{p.salesCount} ventas</div>
                </div>
              </div>
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
          <table className="w-full border-collapse text-[13px] min-w-[600px]">
            <thead className="bg-cream">
              <tr className="text-left text-ink-3 font-mono text-[11px] uppercase tracking-[0.06em]">
                <th className="py-2.5 px-5">ID</th>
                <th className="py-2.5 px-3">Comprador</th>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => {
                const st = ORDER_STATUS_META[o.status];
                return (
                  <tr key={o.id} className="border-b border-line">
                    <td className="py-3 px-5 font-mono text-xs">
                      <Link href={`/orders/${o.id}`} className="block">
                        {o.id}
                      </Link>
                    </td>
                    <td className="py-3 px-3">
                      <Link
                        href={`/orders/${o.id}`}
                        className="flex items-center gap-2"
                      >
                        <Avatar name={o.buyer} size={28} />
                        {o.buyer}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-ink-3">{o.date}</td>
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
                  <div>
                    <div className="font-mono text-xs text-ink-3">{o.id}</div>
                    <div className="text-[15px] font-semibold mt-[3px]">
                      {o.buyer}
                    </div>
                  </div>
                  <Pill tone={st.tone} size="sm">
                    {st.label}
                  </Pill>
                </div>
                <div className="flex justify-between items-center text-ink-3 text-xs">
                  <span>{o.date}</span>
                  <strong className="text-ink text-sm">{fmtARS(o.total)}</strong>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </SellerShell>
  );
}
