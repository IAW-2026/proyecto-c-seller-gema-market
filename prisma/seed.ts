// Seed inicial de desarrollo.
// Genera ULIDs prefijados (`usr_`, `cat_`, `prd_`, `vnt_`, `rsv_`) en cada corrida.
// Para regenerar de cero: `npx prisma migrate reset --force`.

import 'dotenv/config';
import { PrismaClient, ProductStatus, ProductCondition, SaleStatus } from '../lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { newId, PREFIXES } from '../lib/ids';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Limpieza (orden FK: hijos antes que padres) ─────────────────────────────
  await prisma.reserva.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.seller.deleteMany();

  // ── Seller ────────────────────────────────────────────────────────────────
  // `clerkUserId` usa un sentinel local: este seller existe solo para datos de
  // dev y no corresponde a ninguna cuenta real de Clerk. Los sellers reales se
  // crean al loguearse (auto-provision en `getCurrentSeller`) y completan el
  // flujo de /onboarding.
  const sellerId = newId(PREFIXES.seller);
  await prisma.seller.create({
    data: {
      id: sellerId,
      clerkUserId: 'user_3DPo6HmgoTegPypa6iZj1HhOvwF',
      shopName: 'Carpintería Sur',
      email: 'manuelducosp@gmail.com',
      phone: '+54 291 412 5678',
      bio: 'Taller de muebles a medida en Bahía Blanca. Trabajamos con maderas locales desde 2008.',
      city: 'Bahía Blanca',
      street: 'Av. Alem',
      number: '1200',
      postalCode: '8000',
    },
  });

  // ── Categorías ────────────────────────────────────────────────────────────
  const categoryNames = ['Living', 'Dormitorio', 'Comedor', 'Cocina', 'Baño', 'Terraza', 'Decoración'];

  const catIdByName = new Map<string, string>();
  for (const name of categoryNames) {
    const id = newId(PREFIXES.categoria);
    catIdByName.set(name, id);
    await prisma.categoria.create({ data: { id, name } });
  }

  // ── Productos ─────────────────────────────────────────────────────────────
  const productSeeds = [
    { key: 'p1',  title: 'Sillón de pana 2 cuerpos',    categoryName: 'Living',     price: 89000, stock: 3,  condition: ProductCondition.usado, material: 'Pana',             color: 'Verde oliva', weight: 45, height: 90,  width: 180, depth: 85,  status: ProductStatus.active },
    { key: 'p2',  title: 'Mesa de luz roble',           categoryName: 'Dormitorio', price: 24500, stock: 8,  condition: ProductCondition.nuevo, material: 'Roble',            color: 'Natural',     weight: 12, height: 55,  width: 45,  depth: 40,  status: ProductStatus.active },
    { key: 'p3',  title: 'Lámpara de pie mimbre',       categoryName: 'Decoración', price: 18900, stock: 5,  condition: ProductCondition.nuevo, material: 'Mimbre',           color: 'Natural',     weight:  3, height: 160, width: 40,  depth: 40,  status: ProductStatus.active },
    { key: 'p4',  title: 'Juego de sábanas king',       categoryName: 'Dormitorio', price: 32000, stock: 22, condition: ProductCondition.nuevo, material: 'Algodón',          color: 'Blanco',      weight:  1, height:  5,  width: 40,  depth: 30,  status: ProductStatus.active },
    { key: 'p5',  title: 'Set de vajilla 12 pzs',       categoryName: 'Cocina',     price: 15600, stock: 14, condition: ProductCondition.nuevo, material: 'Cerámica',         color: 'Blanco',      weight:  4, height: 25,  width: 40,  depth: 40,  status: ProductStatus.active },
    { key: 'p6',  title: 'Mesa redonda 4 personas',     categoryName: 'Comedor',    price: 67000, stock: 2,  condition: ProductCondition.nuevo, material: 'Madera',           color: 'Natural',     weight: 30, height: 75,  width: 100, depth: 100, status: ProductStatus.active },
    { key: 'p7',  title: 'Cortina de baño bambú',       categoryName: 'Baño',       price:  8400, stock: 30, condition: ProductCondition.nuevo, material: 'Bambú',            color: 'Natural',     weight:  1, height: 200, width: 180, depth:  1,  status: ProductStatus.paused },
    { key: 'p8',  title: 'Reposera plegable lona',      categoryName: 'Terraza',    price: 22500, stock: 6,  condition: ProductCondition.nuevo, material: 'Lona',             color: 'Beige',       weight:  8, height: 90,  width: 60,  depth: 80,  status: ProductStatus.active },
    { key: 'p9',  title: 'Espejo redondo 60cm',         categoryName: 'Decoración', price: 16800, stock: 9,  condition: ProductCondition.nuevo, material: 'Vidrio',           color: 'Dorado',      weight:  3, height: 60,  width: 60,  depth:  5,  status: ProductStatus.active },
    { key: 'p10', title: 'Estantería pino 4 niveles',   categoryName: 'Living',     price: 38900, stock: 4,  condition: ProductCondition.nuevo, material: 'Pino',             color: 'Natural',     weight: 20, height: 160, width: 80,  depth: 30,  status: ProductStatus.active },
    { key: 'p11', title: 'Pava eléctrica 1.7L',         categoryName: 'Cocina',     price: 19200, stock: 18, condition: ProductCondition.nuevo, material: 'Acero inoxidable', color: 'Plateado',    weight:  1, height: 25,  width: 20,  depth: 20,  status: ProductStatus.paused },
    { key: 'p12', title: 'Almohadón lino crudo',        categoryName: 'Decoración', price:  6800, stock: 40, condition: ProductCondition.nuevo, material: 'Lino',             color: 'Crudo',       weight:  1, height: 45,  width: 45,  depth: 15,  status: ProductStatus.active },
  ];

  const productIdByKey = new Map<string, string>();
  for (const p of productSeeds) {
    const id = newId(PREFIXES.product);
    productIdByKey.set(p.key, id);
    await prisma.product.create({
      data: {
        id,
        sellerId,
        title:       p.title,
        description: '',
        weight:      p.weight,
        height:      p.height,
        width:       p.width,
        depth:       p.depth,
        condition:   p.condition,
        material:    p.material,
        color:       p.color,
        price:       p.price,
        currency:    'ARS',
        categoryId:  catIdByName.get(p.categoryName)!,
        stock:       p.stock,
        status:      p.status,
        images:      [],
      },
    });
  }

  // ── Ventas ────────────────────────────────────────────────────────────────
  const saleSeeds = [
    { orderId: 'ord-001', productKey: 'p1', buyerId: 'buyer-001', paymentId: 'pay-001', amount: 1, total: 113500, fee: 6810, status: SaleStatus.shipping        },
    { orderId: 'ord-002', productKey: 'p2', buyerId: 'buyer-002', paymentId: 'pay-002', amount: 1, total:  24500, fee: 1470, status: SaleStatus.paid            },
    { orderId: 'ord-003', productKey: 'p6', buyerId: 'buyer-003', paymentId: 'pay-003', amount: 1, total:  67400, fee: 4044, status: SaleStatus.delivered       },
    { orderId: 'ord-004', productKey: 'p3', buyerId: 'buyer-004', paymentId: 'pay-004', amount: 1, total:  18900, fee: 1134, status: SaleStatus.pending_payment },
    { orderId: 'ord-005', productKey: 'p8', buyerId: 'buyer-005', paymentId: 'pay-005', amount: 1, total:  41200, fee: 2472, status: SaleStatus.delivered       },
  ];

  for (const s of saleSeeds) {
    await prisma.sale.create({
      data: {
        id:        newId(PREFIXES.sale),
        orderId:   s.orderId,
        productId: productIdByKey.get(s.productKey)!,
        sellerId,
        buyerId:   s.buyerId,
        paymentId: s.paymentId,
        amount:    s.amount,
        total:     s.total,
        fee:       s.fee,
        status:    s.status,
      },
    });
  }

  console.log(
    `Seed completo: 1 seller, ${categoryNames.length} categorías, ${productSeeds.length} productos, ${saleSeeds.length} ventas.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
