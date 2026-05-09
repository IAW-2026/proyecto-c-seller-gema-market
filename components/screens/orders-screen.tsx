import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Pager } from "@/components/ui/pager";
import { Pill } from "@/components/ui/pill";
import type { TabItem } from "@/components/ui/tabs";
import { ORDER_STATUS_META } from "@/lib/ui/ui-config";
import { fmtARS, fmtOrderDate } from "@/lib/ui/format";
import type { OrderWithJoins } from "@/types/domain";
import { OrdersToolbar } from "./orders-toolbar";

export type OrdersScreenProps = {
  orders: ReadonlyArray<OrderWithJoins>;
  page: number;
  pageSize: number;
  total: number;
  activeTab: string;
  counts: {
    todos: number;
    preparando: number;
    en_camino: number;
    entregado: number;
  };
};

export function OrdersScreen({
  orders,
  page,
  pageSize,
  total,
  activeTab,
  counts,
}: OrdersScreenProps) {
  const tabs: ReadonlyArray<TabItem> = [
    { id: "todos", label: "Todos", count: counts.todos },
    { id: "preparando", label: "Preparando", count: counts.preparando },
    { id: "en_camino", label: "En camino", count: counts.en_camino },
    { id: "entregado", label: "Entregados", count: counts.entregado },
  ];

  return (
    <>
      <OrdersToolbar activeTab={activeTab} tabs={tabs} />
      <div className="mt-4">
        <Card padding={0}>
          <div className="overflow-x-auto hidden lgx:block">
            <table className="w-full border-collapse text-[13px] min-w-[760px] table-fixed">
              <thead className="bg-cream">
                <tr className="text-left text-ink-3 font-mono text-[11px] uppercase tracking-[0.06em]">
                  <th className="py-2.5 px-5">Producto</th>
                  <th className="py-2.5 px-3 w-48">Comprador</th>
                  <th className="py-2.5 px-3 w-32">Fecha</th>
                  <th className="py-2.5 px-3 w-32">Estado</th>
                  <th className="py-2.5 px-3 w-32 text-right">Total</th>
                  <th className="py-2.5 px-5 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const st = ORDER_STATUS_META[o.status];
                  return (
                    <tr key={o.id} className="border-b border-line">
                      <td className="py-3.5 px-5">
                        <Link href={`/orders/${o.id}`} className="block">
                          <div className="font-medium truncate">{o.productTitle}</div>
                          <div className="text-[11px] text-ink-3">
                            {o.amount} {o.amount === 1 ? "unidad" : "unidades"}
                          </div>
                        </Link>
                      </td>
                      <td className="py-3.5 px-3">
                        <Link
                          href={`/orders/${o.id}`}
                          className="flex items-center gap-2 min-w-0"
                        >
                          <Avatar name={o.buyerName} size={28} />
                          <span className="truncate">{o.buyerName}</span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-3 text-ink-3">{fmtOrderDate(o.createdAt)}</td>
                      <td className="py-3.5 px-3">
                        <Pill tone={st.tone} size="sm">
                          {st.label}
                        </Pill>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-right">
                        {fmtARS(o.total)}
                      </td>
                      <td className="py-3.5 px-5">
                        <Link
                          href={`/orders/${o.id}`}
                          aria-label={`Ver pedido de ${o.productTitle}`}
                          className="inline-flex"
                        >
                          <Icon name="chevronRight" size={16} className="text-ink-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 px-5 text-center text-ink-3">
                      No hay pedidos en esta categoría.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-3 lgx:hidden">
            {orders.map((o) => {
              const st = ORDER_STATUS_META[o.status];
              return (
                <Link
                  key={o.id}
                  href={`/orders/${o.id}`}
                  className="w-full text-left bg-paper border border-line rounded-2xl p-3.5 block"
                >
                  <div className="flex justify-between gap-2.5 items-start mb-3">
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold truncate">
                        {o.productTitle}
                      </div>
                      <div className="text-[11px] text-ink-3 mt-[3px]">
                        {o.buyerName} · {o.amount} {o.amount === 1 ? "unidad" : "unidades"}
                      </div>
                    </div>
                    <Pill tone={st.tone} size="sm">
                      {st.label}
                    </Pill>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-cream rounded-xl p-2.5">
                      <div className="text-[10px] text-ink-3">Fecha</div>
                      <div className="text-xs font-semibold">{fmtOrderDate(o.createdAt)}</div>
                    </div>
                    <div className="bg-cream rounded-xl p-2.5">
                      <div className="text-[10px] text-ink-3">Total</div>
                      <div className="text-xs font-bold">{fmtARS(o.total)}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
            {orders.length === 0 && (
              <div className="text-center text-ink-3 py-10 text-sm">
                No hay pedidos en esta categoría.
              </div>
            )}
          </div>
          <Pager page={page} pageSize={pageSize} total={total} basePath="/orders" />
        </Card>
      </div>
    </>
  );
}
