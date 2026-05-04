import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Pill } from "@/components/ui/pill";
import { ProductGlyph } from "@/components/ui/product-glyph";
import { SellerShell } from "@/components/layout/seller-shell";
import { ORDER_STATUS_META } from "@/lib/data/status";
import { fmtARS } from "@/lib/format";
import type { DashboardStat } from "@/lib/data/dashboard";
import type { Order, Product, Seller } from "@/types/domain";

export type DashboardScreenProps = {
  seller: Seller;
  stats: ReadonlyArray<DashboardStat>;
  salesChartBars: ReadonlyArray<number>;
  topProducts: ReadonlyArray<Product>;
  recentOrders: ReadonlyArray<Order>;
};

export function DashboardScreen({
  seller,
  stats,
  salesChartBars,
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
          <Card key={s.label} padding={20}>
            <div className="text-xs text-ink-3 mb-2">{s.label}</div>
            <div className="text-[26px] font-bold tracking-[-0.02em] mb-2">
              {s.value}
            </div>
            <div
              className={`inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[11px] font-semibold ${s.trend === "up" ? "bg-[#d8e3c8] text-success" : "bg-bone text-ink-3"}`}
            >
              {s.trend === "up" && <Icon name="arrowUp" size={11} />}
              {s.delta}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 mb-6 grid-cols-1 max-[900px]:grid-cols-1 min-[901px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card padding={24}>
          <div className="flex justify-between items-center mb-5">
            <h3 className="m-0 text-base font-semibold">
              Ventas — últimos 14 días
            </h3>
            <select
              aria-label="Período del gráfico"
              className="bg-bone border-0 rounded-full px-3 py-1.5 text-xs"
            >
              <option>14 días</option>
              <option>30 días</option>
              <option>90 días</option>
            </select>
          </div>
          <svg
            viewBox="0 0 560 200"
            className="w-full h-[200px]"
            role="img"
            aria-label="Gráfico de ventas de los últimos 14 días"
          >
            {salesChartBars.map((v, i) => (
              <g key={i}>
                <rect
                  x={i * 40 + 8}
                  y={170 - v}
                  width={28}
                  height={v}
                  rx={4}
                  fill={i === salesChartBars.length - 1 ? "#414833" : "#a4ac86"}
                />
              </g>
            ))}
            <line x1="0" y1="170" x2="560" y2="170" stroke="#e2dccc" />
          </svg>
        </Card>
        <Card padding={24}>
          <h3 className="m-0 mb-4 text-base font-semibold">Top productos</h3>
          <div className="flex flex-col gap-3.5">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-3.5 font-mono text-[11px] text-ink-3">
                  0{i + 1}
                </div>
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${p.palette[0]}55, ${p.palette[1]}55)`,
                  }}
                >
                  <ProductGlyph kind={p.glyph} palette={p.palette} size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                    {p.title}
                  </div>
                  <div className="text-[11px] text-ink-3">{p.reviews} ventas</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

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
