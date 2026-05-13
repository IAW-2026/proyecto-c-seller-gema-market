import { requireCronAuth } from '@/lib/api/auth';
import { jsonOk } from '@/lib/api/responses';
import { sweepExpiredReservas } from '@/lib/data/reservations';

// GET /api/internal/sweep-reservas
// Disparado por Vercel Cron (ver vercel.json). Barre todas las Reservas
// con expiresAt en el pasado, restaura el stock al producto correspondiente
// y devuelve la cantidad barrida + los IDs (útil para logs en Vercel).
//
// Idempotente: si corre dos veces seguidas, la segunda no hace nada (la
// primera ya barrió todas las expiradas).
export async function GET(request: Request): Promise<Response> {
  const authErr = requireCronAuth(request);
  if (authErr) return authErr;

  const result = await sweepExpiredReservas();
  return jsonOk({
    ok: true,
    swept_count: result.sweptCount,
    swept_reserva_ids: result.sweptReservaIds,
  });
}
