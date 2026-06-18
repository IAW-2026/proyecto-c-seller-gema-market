import 'server-only';
import {
  verifyShopOrigin,
  type VerifyShopOriginInput,
} from '@/lib/shipping/client';

// Mensaje fail-closed: cuando la Shipping App no da un veredicto (timeout, red,
// HTTP 500) bloqueamos el guardado y pedimos reintentar.
const UNAVAILABLE_MESSAGE =
  'No pudimos verificar la dirección con el servicio de envíos. Probá de nuevo en unos minutos.';

// Valida la dirección de origen de la tienda contra la Shipping App.
// Devuelve null si es válida, o el mensaje de error a mostrar al seller
// (veredicto explícito de la API, o el mensaje fail-closed si no hubo veredicto).
export async function checkShopOrigin(
  input: VerifyShopOriginInput,
): Promise<string | null> {
  const result = await verifyShopOrigin(input);
  if (result.status === 'valid') return null;
  return result.status === 'invalid' ? result.message : UNAVAILABLE_MESSAGE;
}
