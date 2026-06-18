import 'server-only';
import { z } from 'zod';
import { hashApiKey } from '@/lib/api-auth';

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
      'x-api-key-hash': hashApiKey(shippingApiKey()),
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

// El contrato de POST /api/shipping/sellers/verificar-origen exige `product_id`
// pero la Shipping App lo ignora: solo geocodifica street/number/zip. Acá lo
// usamos para validar la dirección de la *tienda* (alta, onboarding, /shops),
// donde no hay producto, así que mandamos este centinela como product_id.
const SHOP_ORIGIN_PRODUCT_ID = 'shop-origin';

// Cuerpo OK de verificar-origen (Response 200): { valid:true, in_coverage_area }.
const VerifyOriginOkSchema = z.object({
  valid: z.literal(true),
  in_coverage_area: z.boolean(),
});

// Cuerpo de error de verificar-origen (Response 400): { valid:false, error, code }.
const VerifyOriginErrorSchema = z.object({
  valid: z.literal(false),
  error: z.string().min(1),
  code: z.string().min(1),
});

export type VerifyShopOriginInput = {
  street: string;
  number: string;
  zip?: string;
};

// Tres resultados posibles:
// - valid: la dirección existe y está en zona de cobertura.
// - invalid: la Shipping App dio un veredicto explícito (INVALID_ADDRESS /
//   OUTSIDE_COVERAGE) — se muestra `message` al seller.
// - unavailable: no hubo veredicto (timeout, red, HTTP 500, shape inesperado).
//   El caller decide; en esta app se trata fail-closed (bloquea el guardado).
export type VerifyShopOriginResult =
  | { status: 'valid' }
  | { status: 'invalid'; code: string; message: string }
  | { status: 'unavailable' };

export async function verifyShopOrigin(
  input: VerifyShopOriginInput,
): Promise<VerifyShopOriginResult> {
  const url = `${shippingBaseUrl()}/api/shipping/sellers/verificar-origen`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key-hash': hashApiKey(shippingApiKey()),
      },
      body: JSON.stringify({
        product_id: SHOP_ORIGIN_PRODUCT_ID,
        street: input.street,
        number: input.number,
        ...(input.zip ? { zip: input.zip } : {}),
      }),
      cache: 'no-store',
      // No seguir redirects: si la URL no es la Shipping App (ej. cae en el
      // middleware de auth de otra app) el 3xx no debe tratarse como veredicto.
      redirect: 'manual',
    });
  } catch {
    // Red caída / timeout: sin veredicto.
    return { status: 'unavailable' };
  }

  // 200 = veredicto positivo, pero solo si el body matchea el contrato real.
  // Un 200 con otra forma (ej. HTML de un login) NO es un "válido".
  if (res.ok) {
    const parsed = VerifyOriginOkSchema.safeParse(
      await res.json().catch(() => null),
    );
    return parsed.success ? { status: 'valid' } : { status: 'unavailable' };
  }

  // 400 = veredicto de validación. Cualquier otro status (3xx, 401, 500, …) o
  // un body que no matchee el contrato se trata como "no pudimos verificar".
  if (res.status === 400) {
    const parsed = VerifyOriginErrorSchema.safeParse(
      await res.json().catch(() => null),
    );
    if (parsed.success) {
      return {
        status: 'invalid',
        code: parsed.data.code,
        message: parsed.data.error,
      };
    }
  }

  return { status: 'unavailable' };
}

// Solo necesitamos el link de tracking de GET /api/shipping/envios/:order_id.
const ShipmentTrackingSchema = z.object({
  tracking_url: z.string().url(),
});

// Devuelve el `tracking_url` del envío de una orden, o null si no se pudo
// obtener (envío inexistente, servicio caído, etc.). Es display-only: degrada
// a null para que el detalle del pedido siga mostrando el código sin link.
export async function getShipmentTrackingUrl(
  orderId: string,
): Promise<string | null> {
  const url = `${shippingBaseUrl()}/api/shipping/envios/${encodeURIComponent(orderId)}`;

  try {
    const res = await fetch(url, {
      headers: { 'x-api-key-hash': hashApiKey(shippingApiKey()) },
      cache: 'no-store',
      redirect: 'manual',
    });
    if (!res.ok) return null;
    const parsed = ShipmentTrackingSchema.safeParse(await res.json());
    return parsed.success ? parsed.data.tracking_url : null;
  } catch {
    return null;
  }
}
