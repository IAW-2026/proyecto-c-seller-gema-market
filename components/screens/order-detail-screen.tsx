import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { ProductGlyph } from "@/components/ui/product-glyph";
import { PageHeader } from "@/components/layout/page-header";
import {
  getOrderTimelineIndex,
  getProductVisual,
  ORDER_STATUS_META,
  ORDER_TIMELINE,
} from "@/lib/ui/ui-config";
import { fmtARS } from "@/lib/ui/format";
import { nextOrderStatus } from "@/lib/data/orders";
import type { BuyerInfo, Order, PaymentInfo, ProductWithJoins, ShippingInfo } from "@/types/domain";
import { OrderActionButton } from "./order-action-button";

export type OrderDetailScreenProps = {
  order: Order;
  product: ProductWithJoins;
  buyerInfo: BuyerInfo;
  shippingInfo: ShippingInfo;
  paymentInfo: PaymentInfo;
};

export function OrderDetailScreen({
  order,
  product,
  buyerInfo,
  shippingInfo,
  paymentInfo,
}: OrderDetailScreenProps) {
  const status = ORDER_STATUS_META[order.status];
  const statusIndex = getOrderTimelineIndex(order.status);
  const hasNextTransition = nextOrderStatus(order.status) !== null;
  const isWaitingExternal = order.status === "shipping";
  const showActionSlot = hasNextTransition || isWaitingExternal;

  return (
    <>
      <PageHeader
        subtitle={`Pedido ${order.id}`}
        title={`Para ${buyerInfo.name}`}
        action={
          showActionSlot ? (
            <OrderActionButton orderId={order.id} status={order.status} />
          ) : undefined
        }
      />
      <div className={`p-4 lgx:px-7 lgx:py-6 ${showActionSlot ? "pb-32" : "pb-16"}`}>
      <div className="grid gap-4 grid-cols-1 min-[901px]:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="flex flex-col gap-4">
          <Card padding={20}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0 text-base font-semibold">Estado del pedido</h3>
              <Pill tone={status.tone}>{status.label}</Pill>
            </div>
            <div className="flex gap-1">
              {ORDER_TIMELINE.map((step, i) => (
                <div key={step.status} className="flex-1">
                  <div
                    className={`h-1 rounded-full mb-2 ${i <= statusIndex ? "bg-cocoa" : "bg-line-2"}`}
                  />
                  <div className="text-[11px] text-ink-3 font-mono">
                    0{i + 1} {step.label}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding={0}>
            <div className="p-5 border-b border-line">
              <h3 className="m-0 text-base font-semibold">Productos</h3>
            </div>
            {(() => {
              const visual = getProductVisual(product.categoryName);
              return (
                <div className="p-4 flex gap-3 items-center border-b border-line max-[900px]:flex-wrap max-[900px]:items-start">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${visual.palette[0]}55, ${visual.palette[1]}55)`,
                    }}
                  >
                    <ProductGlyph kind={visual.glyph} palette={visual.palette} size={32} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{product.title}</div>
                    <div className="text-xs text-ink-3 font-mono">
                      SKU-{product.id.toUpperCase()} · 1 unidad
                    </div>
                  </div>
                  <div className="font-semibold max-[900px]:w-full max-[900px]:text-left">
                    {fmtARS(product.price)}
                  </div>
                </div>
              );
            })()}
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
              <Avatar name={buyerInfo.name} size={44} />
              <div>
                <div className="font-semibold">{buyerInfo.name}</div>
                <div className="text-xs text-ink-3">{buyerInfo.previousPurchases} compras previas</div>
              </div>
            </div>
          </Card>

          <Card padding={20}>
            <h4 className="m-0 mb-3 text-[13px] font-semibold text-ink-3 uppercase tracking-[0.06em] font-mono">
              Envío
            </h4>
            <div className="text-sm mb-1.5">{shippingInfo.address}</div>
            <div className="text-xs text-ink-3">
              Tracking: <span className="font-mono">{shippingInfo.trackingCode}</span>
            </div>
            <div className="text-xs text-ink-3 mt-1">Repartidor: {shippingInfo.carrier}</div>
          </Card>

          <Card padding={20}>
            <h4 className="m-0 mb-3 text-[13px] font-semibold text-ink-3 uppercase tracking-[0.06em] font-mono">
              Pago
            </h4>
            <div className="flex justify-between text-[13px] mb-1">
              <span>Método</span>
              <span>{paymentInfo.method}</span>
            </div>
            <div className="flex justify-between text-[13px] mb-1">
              <span>Estado</span>
              <Pill size="sm" tone={paymentInfo.approved ? "success" : "danger"}>
                {paymentInfo.statusLabel}
              </Pill>
            </div>
            <div className="flex justify-between text-[13px]">
              <span>Comisión</span>
              <span>{fmtARS(order.fee)}</span>
            </div>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
}
