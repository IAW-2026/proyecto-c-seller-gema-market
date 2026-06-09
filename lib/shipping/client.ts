import 'server-only';
import { z } from 'zod';

// Alineado con el contrato de POST /api/shipping/envios en docs/apis.md.
const ShippingResponseSchema = z.object({
  status: z.string().min(1),
  tracking_code: z.string().min(1),
});

export type RequestShippingInput = {
  orderId: string;
  sellerId: string;
  buyerId: string;
  originAddress: {
    street: string;
    number: string;
    zip: string;
    city: string;
  };
};

export type RequestShippingResult = {
  status: string;
  trackingCode: string;
};

function shippingBaseUrl(): string {
  const v = process.env.SHIPPING_SERVICE_URL;
  if (!v) throw new Error('Missing env var: SHIPPING_SERVICE_URL');
  return v;
}

function shippingApiKey(): string {
  const v = process.env.SHIPPING_API_KEY;
  if (!v) throw new Error('Missing env var: SHIPPING_API_KEY');
  return v;
}

export async function requestShipping(
  input: RequestShippingInput,
): Promise<RequestShippingResult> {
  const url = `${shippingBaseUrl()}/api/shipping/envios`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': shippingApiKey(),
    },
    body: JSON.stringify({
      order_id: input.orderId,
      seller_id: input.sellerId,
      buyer_id: input.buyerId,
      origin_address: input.originAddress,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Shipping request failed: HTTP ${res.status}`);
  }

  const parsed = ShippingResponseSchema.parse(await res.json());
  return {
    status: parsed.status,
    trackingCode: parsed.tracking_code,
  };
}
