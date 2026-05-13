import { z } from 'zod';

const RequestSchema = z.object({
  order_id: z.string().min(1),
  seller_id: z.string().min(1),
  buyer_id: z.string().min(1),
});

function randomTrackingCode(): string {
  const n = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BB-${n}-2026`;
}

export async function POST(request: Request): Promise<Response> {
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
    { tracking_code: randomTrackingCode() },
    { status: 201 },
  );
}
