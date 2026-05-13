// Seed dedicado para tests. No depende de Pexels, Supabase, ni red: las URLs
// de imágenes son placeholders fijos. La estructura es determinística y los
// IDs hardcodeados, así los tests pueden asertar contra valores concretos.
//
// IMPORTANTE: corre contra el schema `test` (definido en DATABASE_URL_TEST).
// No tiene relación con `prisma/seed.ts` (dev/prod) — son universos paralelos.
//
// Snapshot del estado tras runTestSeed():
//   - 2 sellers (uno principal, uno secundario para probar scoping).
//   - 3 categorías (Living, Dormitorio, Cocina).
//   - 8 productos del seller principal + 1 de otro seller:
//       - 4 activos con stock (sillon, mesaLuz, pava, vajilla).
//       - 1 activo sin stock (espejo).
//       - 1 pausado (cortina) — no debe aparecer en endpoints públicos.
//       - 1 soft-deleted (lampara) — no debe aparecer.
//       - 1 de otro seller (ajeno).
//   - 3 ventas en distintos estados (paid, shipping, delivered).
//   - 0 reservas (las crean/borran los tests mutating).
//
// Los IDs son strings semánticos, no ULIDs reales. El schema acepta cualquier
// string; el prefijo es solo convención para legibilidad.

import { prisma } from '@/lib/db';

export const TEST_SELLER_ID = 'usr_test_main';
export const TEST_OTHER_SELLER_ID = 'usr_test_other';

export const TEST_CATEGORY_IDS = {
  living: 'cat_test_living',
  dormitorio: 'cat_test_dormitorio',
  cocina: 'cat_test_cocina',
} as const;

export const TEST_PRODUCT_IDS = {
  sillon: 'prd_test_sillon',     // active, stock 5, condition usado, Living
  mesaLuz: 'prd_test_mesaluz',   // active, stock 10, condition nuevo, Dormitorio
  pava: 'prd_test_pava',         // active, stock 1, condition nuevo, Cocina
  vajilla: 'prd_test_vajilla',   // active, stock 14, condition nuevo, Cocina
  espejo: 'prd_test_espejo',     // active, stock 0, Living
  cortina: 'prd_test_cortina',   // paused, Living
  lampara: 'prd_test_lampara',   // active pero soft-deleted, Living
  ajeno: 'prd_test_ajeno',       // de TEST_OTHER_SELLER_ID, Cocina
} as const;

export const TEST_SALES = {
  paid: 'ord-test-001',      // paid, sin tracking
  shipping: 'ord-test-002',  // shipping con tracking
  delivered: 'ord-test-003', // delivered
} as const;

// Mapa producto → stock inicial. Se usa tanto en el seed (al crear) como en
// resetMutableState() (al restaurar entre tests mutating). Mantener en sync
// con los `stock: N` de los `prisma.product.create` de abajo.
export const SEED_PRODUCT_STOCK: Readonly<Record<string, number>> = {
  [TEST_PRODUCT_IDS.sillon]: 5,
  [TEST_PRODUCT_IDS.mesaLuz]: 10,
  [TEST_PRODUCT_IDS.pava]: 1,
  [TEST_PRODUCT_IDS.vajilla]: 14,
  [TEST_PRODUCT_IDS.espejo]: 0,
  [TEST_PRODUCT_IDS.cortina]: 30,
  [TEST_PRODUCT_IDS.lampara]: 5,
  [TEST_PRODUCT_IDS.ajeno]: 3,
};

// IDs de las Sales del seed + su estado inicial. resetMutableState borra Sales
// con id NO incluido acá (las que crearon los tests) y restaura status/tracking
// de estas (las que pudieron mutar tests de estado-envio).
export const SEED_SALES_STATE: ReadonlyArray<{
  id: string;
  status: 'paid' | 'shipping' | 'delivered' | 'shipping_failed';
  trackingCode: string | null;
}> = [
  { id: 'vnt_test_001', status: 'paid', trackingCode: null },
  { id: 'vnt_test_002', status: 'shipping', trackingCode: 'TRK-TEST-002' },
  { id: 'vnt_test_003', status: 'delivered', trackingCode: 'TRK-TEST-003' },
];

const PLACEHOLDER_LOGO = 'https://placehold.co/400x400/png?text=Logo';
const PLACEHOLDER_COVER = 'https://placehold.co/1200x400/png?text=Cover';
const PLACEHOLDER_THUMB = 'https://placehold.co/600x600/png?text=Product';
const PLACEHOLDER_GALLERY_1 = 'https://placehold.co/800x800/png?text=Gallery1';
const PLACEHOLDER_GALLERY_2 = 'https://placehold.co/800x800/png?text=Gallery2';
const baseImages = [PLACEHOLDER_GALLERY_1, PLACEHOLDER_GALLERY_2];

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

// Trunca todas las tablas en orden FK-safe. Lo exponemos por separado para que
// los tests mutating puedan resetear sin re-seedear si solo necesitan limpiar.
export async function truncateAll(): Promise<void> {
  await prisma.reserva.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.seller.deleteMany();
}

export async function runTestSeed(): Promise<void> {
  await truncateAll();

  // ── Sellers ───────────────────────────────────────────────────────────────
  await prisma.seller.create({
    data: {
      id: TEST_SELLER_ID,
      clerkUserId: 'clerk_test_seller_main',
      shopName: 'Carpintería Sur',
      email: 'test-seller@example.com',
      phone: '+54 291 412 5678',
      bio: 'Taller de muebles a medida.',
      city: 'Bahía Blanca',
      street: 'Av. Alem',
      number: '1200',
      postalCode: '8000',
      coverUrl: PLACEHOLDER_COVER,
      logoUrl: PLACEHOLDER_LOGO,
    },
  });

  await prisma.seller.create({
    data: {
      id: TEST_OTHER_SELLER_ID,
      clerkUserId: 'clerk_test_seller_other',
      shopName: 'Otro Shop',
      email: 'other@example.com',
      phone: '+54 291 000 0000',
      city: 'Rosario',
      street: 'Otro',
      number: '1',
      postalCode: '2000',
    },
  });

  // ── Categorías ────────────────────────────────────────────────────────────
  await prisma.categoria.createMany({
    data: [
      { id: TEST_CATEGORY_IDS.living, name: 'Living' },
      { id: TEST_CATEGORY_IDS.dormitorio, name: 'Dormitorio' },
      { id: TEST_CATEGORY_IDS.cocina, name: 'Cocina' },
    ],
  });

  // ── Productos ─────────────────────────────────────────────────────────────
  await prisma.product.create({
    data: {
      id: TEST_PRODUCT_IDS.sillon,
      sellerId: TEST_SELLER_ID,
      title: 'Sillón de pana verde',
      description: 'Sillón usado en muy buen estado.',
      weight: 45, height: 90, width: 180, depth: 85,
      condition: 'usado',
      material: 'Pana', color: 'Verde',
      price: 89000, currency: 'ARS',
      categoryId: TEST_CATEGORY_IDS.living,
      stock: 5, status: 'active',
      thumbnailUrl: PLACEHOLDER_THUMB,
      images: baseImages,
      createdAt: daysAgo(30),
    },
  });

  await prisma.product.create({
    data: {
      id: TEST_PRODUCT_IDS.mesaLuz,
      sellerId: TEST_SELLER_ID,
      title: 'Mesa de luz roble',
      description: 'Mesa de luz nueva en roble natural.',
      weight: 12, height: 55, width: 45, depth: 40,
      condition: 'nuevo',
      material: 'Roble', color: 'Natural',
      price: 24500, currency: 'ARS',
      categoryId: TEST_CATEGORY_IDS.dormitorio,
      stock: 10, status: 'active',
      thumbnailUrl: PLACEHOLDER_THUMB,
      images: baseImages,
      createdAt: daysAgo(20),
    },
  });

  await prisma.product.create({
    data: {
      id: TEST_PRODUCT_IDS.pava,
      sellerId: TEST_SELLER_ID,
      title: 'Pava eléctrica',
      description: 'Pava eléctrica 1.7L nueva.',
      weight: 1, height: 25, width: 20, depth: 20,
      condition: 'nuevo',
      material: 'Acero inoxidable', color: 'Plateado',
      price: 19200, currency: 'ARS',
      categoryId: TEST_CATEGORY_IDS.cocina,
      stock: 1, status: 'active',
      thumbnailUrl: PLACEHOLDER_THUMB,
      images: baseImages,
      createdAt: daysAgo(15),
    },
  });

  await prisma.product.create({
    data: {
      id: TEST_PRODUCT_IDS.vajilla,
      sellerId: TEST_SELLER_ID,
      title: 'Vajilla cerámica',
      description: 'Set de vajilla 12 piezas.',
      weight: 4, height: 25, width: 40, depth: 40,
      condition: 'nuevo',
      material: 'Cerámica', color: 'Blanco',
      price: 15600, currency: 'ARS',
      categoryId: TEST_CATEGORY_IDS.cocina,
      stock: 14, status: 'active',
      thumbnailUrl: PLACEHOLDER_THUMB,
      images: baseImages,
      createdAt: daysAgo(10),
    },
  });

  await prisma.product.create({
    data: {
      id: TEST_PRODUCT_IDS.espejo,
      sellerId: TEST_SELLER_ID,
      title: 'Espejo redondo',
      description: 'Espejo decorativo de pared.',
      weight: 3, height: 60, width: 60, depth: 5,
      condition: 'nuevo',
      material: 'Vidrio', color: 'Dorado',
      price: 16800, currency: 'ARS',
      categoryId: TEST_CATEGORY_IDS.living,
      stock: 0, status: 'active',
      thumbnailUrl: PLACEHOLDER_THUMB,
      images: baseImages,
      createdAt: daysAgo(5),
    },
  });

  await prisma.product.create({
    data: {
      id: TEST_PRODUCT_IDS.cortina,
      sellerId: TEST_SELLER_ID,
      title: 'Cortina pausada',
      description: 'Producto pausado: no debe aparecer en endpoints públicos.',
      weight: 1, height: 200, width: 180, depth: 1,
      condition: 'nuevo',
      material: 'Bambú', color: 'Natural',
      price: 8400, currency: 'ARS',
      categoryId: TEST_CATEGORY_IDS.living,
      stock: 30, status: 'paused',
      thumbnailUrl: PLACEHOLDER_THUMB,
      images: baseImages,
      createdAt: daysAgo(40),
    },
  });

  await prisma.product.create({
    data: {
      id: TEST_PRODUCT_IDS.lampara,
      sellerId: TEST_SELLER_ID,
      title: 'Lámpara borrada',
      description: 'Producto soft-deleted: no debe aparecer en endpoints públicos.',
      weight: 3, height: 160, width: 40, depth: 40,
      condition: 'nuevo',
      material: 'Mimbre', color: 'Natural',
      price: 18900, currency: 'ARS',
      categoryId: TEST_CATEGORY_IDS.living,
      stock: 5, status: 'active',
      thumbnailUrl: PLACEHOLDER_THUMB,
      images: baseImages,
      createdAt: daysAgo(50),
      deletedAt: daysAgo(1),
    },
  });

  await prisma.product.create({
    data: {
      id: TEST_PRODUCT_IDS.ajeno,
      sellerId: TEST_OTHER_SELLER_ID,
      title: 'Producto de otro seller',
      description: 'Activo pero pertenece a TEST_OTHER_SELLER_ID.',
      weight: 1, height: 1, width: 1, depth: 1,
      condition: 'nuevo',
      material: 'Otro', color: 'Otro',
      price: 1000, currency: 'ARS',
      categoryId: TEST_CATEGORY_IDS.cocina,
      stock: 3, status: 'active',
      thumbnailUrl: PLACEHOLDER_THUMB,
      images: baseImages,
      createdAt: daysAgo(7),
    },
  });

  // ── Ventas ────────────────────────────────────────────────────────────────
  await prisma.sale.create({
    data: {
      id: 'vnt_test_001',
      orderId: TEST_SALES.paid,
      productId: TEST_PRODUCT_IDS.sillon,
      sellerId: TEST_SELLER_ID,
      buyerId: 'buyer-test-001',
      buyerName: 'Comprador Uno',
      paymentId: 'pay-test-001',
      amount: 1,
      total: 89000,
      fee: 5340,
      status: 'paid',
      trackingCode: null,
      createdAt: daysAgo(3),
    },
  });

  await prisma.sale.create({
    data: {
      id: 'vnt_test_002',
      orderId: TEST_SALES.shipping,
      productId: TEST_PRODUCT_IDS.mesaLuz,
      sellerId: TEST_SELLER_ID,
      buyerId: 'buyer-test-002',
      buyerName: 'Comprador Dos',
      paymentId: 'pay-test-002',
      amount: 1,
      total: 24500,
      fee: 1470,
      status: 'shipping',
      trackingCode: 'TRK-TEST-002',
      createdAt: daysAgo(8),
    },
  });

  await prisma.sale.create({
    data: {
      id: 'vnt_test_003',
      orderId: TEST_SALES.delivered,
      productId: TEST_PRODUCT_IDS.vajilla,
      sellerId: TEST_SELLER_ID,
      buyerId: 'buyer-test-003',
      buyerName: 'Comprador Tres',
      paymentId: 'pay-test-003',
      amount: 2,
      total: 31200,
      fee: 1872,
      status: 'delivered',
      trackingCode: 'TRK-TEST-003',
      createdAt: daysAgo(15),
    },
  });
}
