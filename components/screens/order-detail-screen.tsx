import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { ProductGlyph } from "@/components/ui/product-glyph";
import { SellerShell } from "@/components/layout/seller-shell";
import { ORDER_TIMELINE } from "@/lib/data/order-timeline";
import { ORDER_STATUS_META } from "@/lib/data/status";
import { fmtARS } from "@/lib/format";
import type { Order, Product, Seller } from "@/types/domain";

export type OrderDetailScreenProps = {
  seller: Seller;
  order: Order;
  items: ReadonlyArray<Product>;
};

export function OrderDetailScreen({
  seller,
  order,
  items,
}: OrderDetailScreenProps) {
  const status = ORDER_STATUS_META[order.status];

  return (
    <SellerShell
      seller={seller}
      activeNavId="orders"
      subtitle={`Pedido ${order.id}`}
      title={`Para ${order.buyer}`}
      action={
        <Button variant="accent" icon="check">
          Marcar como listo
        </Button>
      }
    >
      <div className="grid gap-4 grid-cols-1 min-[901px]:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="flex flex-col gap-4">
          <Card padding={20}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0 text-base font-semibold">Estado del pedido</h3>
              <Pill tone={status.tone}>{status.label}</Pill>
            </div>
            <div className="flex gap-1">
              {ORDER_TIMELINE.map((s, i) => (
                <div key={s} className="flex-1">
                  <div
                    className={`h-1 rounded-full mb-2 ${i <= 2 ? "bg-cocoa" : "bg-line-2"}`}
                  />
                  <div className="text-[11px] text-ink-3 font-mono">
                    0{i + 1} {s}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding={0}>
            <div className="p-5 border-b border-line">
              <h3 className="m-0 text-base font-semibold">Productos</h3>
            </div>
            {items.map((p) => (
              <div
                key={p.id}
                className="p-4 flex gap-3 items-center border-b border-line max-[900px]:flex-wrap max-[900px]:items-start"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${p.palette[0]}55, ${p.palette[1]}55)`,
                  }}
                >
                  <ProductGlyph kind={p.glyph} palette={p.palette} size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-ink-3 font-mono">
                    SKU-{p.id.toUpperCase()} · 1 unidad
                  </div>
                </div>
                <div className="font-semibold max-[900px]:w-full max-[900px]:text-left">
                  {fmtARS(p.price)}
                </div>
              </div>
            ))}
            <div className="p-5 flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{fmtARS(order.total)}</span>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card padding={20}>
            <h4 className="m-0 mb-3 text-[13px] font-semibold text-ink-3 uppercase tracking-[0.06em] font-mono">
              Comprador
            </h4>
            <div className="flex items-center gap-3">
              <Avatar name={order.buyer} size={44} />
              <div>
                <div className="font-semibold">{order.buyer}</div>
                <div className="text-xs text-ink-3">3 compras previas</div>
              </div>
            </div>
          </Card>

          <Card padding={20}>
            <h4 className="m-0 mb-3 text-[13px] font-semibold text-ink-3 uppercase tracking-[0.06em] font-mono">
              Envío
            </h4>
            <div className="text-sm mb-1.5">{order.address}</div>
            <div className="text-xs text-ink-3">
              Tracking: <span className="font-mono">{order.trackId}</span>
            </div>
            <div className="text-xs text-ink-3 mt-1">Repartidor: Marcos R.</div>
          </Card>

          <Card padding={20}>
            <h4 className="m-0 mb-3 text-[13px] font-semibold text-ink-3 uppercase tracking-[0.06em] font-mono">
              Pago
            </h4>
            <div className="flex justify-between text-[13px] mb-1">
              <span>Método</span>
              <span>Mercado Pago</span>
            </div>
            <div className="flex justify-between text-[13px] mb-1">
              <span>Estado</span>
              <Pill size="sm" tone="success">
                Aprobado
              </Pill>
            </div>
            <div className="flex justify-between text-[13px]">
              <span>Comisión</span>
              <span>{fmtARS(Math.round(order.total * 0.06))}</span>
            </div>
          </Card>
        </div>
      </div>
    </SellerShell>
  );
}
