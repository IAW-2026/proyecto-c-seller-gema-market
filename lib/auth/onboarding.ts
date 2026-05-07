import type { Seller } from '@/types/domain';

// Ruta donde vive el flujo de onboarding. Centralizada acá para que el gate
// (en `(seller)/layout.tsx`) y la propia página la importen del mismo lugar.
export const ONBOARDING_PATH = '/onboarding';

// Campos que el seller debe completar antes de entrar al panel. Si mañana se
// agrega o saca alguno, se cambia acá y todos los call sites siguen
// preguntando `isOnboarded()` sin saber el detalle. `apartment` y `bio`
// quedan opcionales — no bloquean el ingreso.
const REQUIRED_FIELDS = [
  'shopName',
  'phone',
  'city',
  'street',
  'number',
  'postalCode',
] as const satisfies ReadonlyArray<keyof Seller>;

export function isOnboarded(seller: Seller): boolean {
  return REQUIRED_FIELDS.every((key) => {
    const v = seller[key];
    return typeof v === 'string' && v.trim() !== '';
  });
}
