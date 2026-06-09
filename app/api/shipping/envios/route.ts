import { z } from 'zod';
import { checkApiKeyAuth } from '@/lib/api-auth';

const OriginAddressSchema = z.object({
  street: z.string().min(1),
  number: z.string().min(1),
  zip: z.string().min(1),
  city: z.string().min(1),
});

const RequestSchema = z.object({
  order_id: z.string().min(1),
  seller_id: z.string().min(1),
  buyer_id: z.string().min(1),
  origin_address: OriginAddressSchema,
});

function randomTrackingCode(): string {
  const n = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BB-${n}-2026`;
}

export async function POST(request: Request): Promise<Response> {
  const expectedKey = process.env.SHIPPING_API_KEY;
  if (!expectedKey) {
    return Response.json({ error: 'Server misconfiguration' }, { status: 500 });
  }
  if (!checkApiKeyAuth(request, expectedKey)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: 'Bad Request' }, { status: 400 });
  }

  return Response.json(
    { status: 'pending_pickup', tracking_code: randomTrackingCode() },
    { status: 201 },
  );
}
