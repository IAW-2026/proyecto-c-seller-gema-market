import type { ZodType } from 'zod';
import { jsonBadRequest } from '@/lib/api/responses';

// Parse + valida el body JSON del request contra un schema Zod.
// Devuelve `{ data }` si OK, o `{ error: Response }` con un 400 listo para
// retornar desde el handler. Las dos ramas son discriminadas por la presencia
// de `data` para que TS estreche el tipo en cada caso.
export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ data: T } | { error: Response }> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return { error: jsonBadRequest('Invalid JSON body') };
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { error: jsonBadRequest('Bad Request') };
  }
  return { data: parsed.data };
}

// Mismo patrón pero para los query params de un GET. `url` es `request.url`
// (string completo) — se parsea como URL para extraer searchParams.
export function parseSearchParams<T>(
  url: string,
  schema: ZodType<T>,
): { data: T } | { error: Response } {
  const params = Object.fromEntries(new URL(url).searchParams.entries());
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    return { error: jsonBadRequest('Bad Request') };
  }
  return { data: parsed.data };
}
