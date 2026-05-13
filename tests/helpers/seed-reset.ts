// Reset entre tests mutating. Re-corre el seed completo para volver al
// estado conocido del fixture. Es más lento que un truncate parcial pero
// asegura consistencia (stock restaurado, reservas borradas, sales en su
// estado original).
//
// Llamar desde `beforeEach` en las suites que mutan estado (reservar,
// liberar-reserva, pagos/confirmado, estado-envio).

import { runTestSeed } from '@/tests/fixtures/seed';

export async function resetSeed(): Promise<void> {
  await runTestSeed();
}
