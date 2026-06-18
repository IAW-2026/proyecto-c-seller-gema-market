// Tipos del contrato HTTP para los endpoints de reservas.

export type ReservarRequest = {
  order_id: string;
  buyer_id: string;
  buyer_name: string;
  quantity: number;
};

export type ReservarResponse = { ok: true };

export type LiberarReservaRequest = {
  order_id: string;
};

export type LiberarReservaResponse = { ok: true };
