// Resets entre tests mutating. Dos variantes:
//
//   resetMutableState()  — selectivo y rápido (~5x más rápido que reset
//                          completo). Borra Reservas, borra Sales creadas
//                          por tests, restaura stock y status de las Sales
//                          del seed. Usar en `beforeEach` de las suites
//                          mutating de reservar/liberar/confirmado/estado-envio.
//
//   resetSeed()          — full reseed (truncate + recrea todo). Lento, pero
//                          a prueba de cualquier mutación. Usar si una suite
//                          rompe invariantes que el selective no cubre.

import { prisma } from '@/lib/db';
import {
  SEED_PRODUCT_STOCK,
  SEED_SALES_STATE,
  runTestSeed,
} from '@/tests/fixtures/seed';

export async function resetSeed(): Promise<void> {
  await runTestSeed();
}

export async function resetMutableState(): Promise<void> {
  const seedSaleIds = SEED_SALES_STATE.map((s) => s.id);

  // 1. Borrar todas las Reservas (el seed tiene 0).
  await prisma.reserva.deleteMany({});

  // 2. Borrar Sales que crearon los tests (cualquiera que no sea del seed).
  await prisma.sale.deleteMany({
    where: { id: { notIn: seedSaleIds } },
  });

  // 3. Restaurar status + trackingCode de las Sales del seed (tests de
  // estado-envio las muta).
  await Promise.all(
    SEED_SALES_STATE.map((s) =>
      prisma.sale.update({
        where: { id: s.id },
        data: { status: s.status, trackingCode: s.trackingCode },
      }),
    ),
  );

  // 4. Restaurar stock de los productos al valor del seed.
  await Promise.all(
    Object.entries(SEED_PRODUCT_STOCK).map(([id, stock]) =>
      prisma.product.update({ where: { id }, data: { stock } }),
    ),
  );
}
