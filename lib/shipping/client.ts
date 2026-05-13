import 'server-only';
import { z } from 'zod';

// Schema flexible: el mock interno devuelve sólo tracking_code, pero la
// Shipping App real (ver docs/apis.md) responde con los 3 campos del contrato.
// Aceptamos ambos para que el switch a la integración real no requiera tocar
// este cliente.
const ShippingResponseSchema = z.object({
  tracking_code: z.string().min(1),
  shipping_id: z.string().optional(),
  status: z.string().optional(),
});

export type RequestShippingInput = {
  orderId: string;
  sellerId: string;
  buyerId: string;
};

export type RequestShippingResult = {
  trackingCode: string;
  shippingId?: string;
  status?: string;
};

function shippingBaseUrl(): string {
  const v = process.env.SHIPPING_SERVICE_URL;
  if (!v) throw new Error('Missing env var: SHIPPING_SERVICE_URL');
  return v;
}

export async function requestShipping(
  input: RequestShippingInput,
): Promise<RequestShippingResult> {
  const url = `${shippingBaseUrl()}/api/shipping/envios`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      order_id: input.orderId,
      seller_id: input.sellerId,
      buyer_id: input.buyerId,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Shipping request failed: HTTP ${res.status}`);
  }

  const parsed = ShippingResponseSchema.parse(await res.json());
  return {
    trackingCode: parsed.tracking_code,
    shippingId: parsed.shipping_id,
    status: parsed.status,
  };
}
