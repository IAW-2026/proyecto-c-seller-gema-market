// Tipos del contrato HTTP para los endpoints de ventas.
//
// `ShippingExternalStatus` es el vocabulario que envía Shipping App.
// El handler lo traduce al `OrderStatus` interno antes de persistir:
//   in_transit → shipping, delivered → delivered, failed → shipping_failed.

export type ShippingExternalStatus = 'in_transit' | 'delivered' | 'failed';

export type EstadoEnvioRequest = {
  order_id: string;
  status: ShippingExternalStatus;
  tracking_code: string;
  updated_at: string;
};

export type EstadoEnvioResponse = { ok: true };
