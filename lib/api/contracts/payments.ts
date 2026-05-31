// Tipos del contrato HTTP para los endpoints de pagos.

export type PagoConfirmadoOrderItem = {
  order_id: string;
  product_id: string;
  quote_id: string;
  amount: number;   // monto cobrado al comprador (mapea a Sale.total)
  fee: number;
  currency: string;
  paid_at: string;
};

export type PagoConfirmadoRequest = {
  payment_id: string;
  orders: PagoConfirmadoOrderItem[];
};

export type PagoConfirmadoResponse = { ok: true };
