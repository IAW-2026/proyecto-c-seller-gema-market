// Seed inicial de desarrollo.
// Genera ULIDs prefijados (`usr_`, `cat_`, `prd_`, `vnt_`, `rsv_`) en cada corrida.
// Para regenerar de cero: `npx prisma migrate reset --force`.

import 'dotenv/config';
import { PrismaClient, ProductStatus, ProductCondition, SaleStatus } from '../lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { newId, PREFIXES } from '../lib/ids';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

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
  // `daysAgo` controla `createdAt` para probar orden y filtros temporales.
  // Mezcla intencional de status, condition, stock (incluye 0) y rango de precios.
  const productSeeds = [
    { key: 'p1',  title: 'Sillón de pana 2 cuerpos',        categoryName: 'Living',     price:  89000, stock:  3, condition: ProductCondition.usado, material: 'Pana',             color: 'Verde oliva', weight: 45, height:  90, width: 180, depth:  85, status: ProductStatus.active, daysAgo: 180 },
    { key: 'p2',  title: 'Mesa de luz roble',               categoryName: 'Dormitorio', price:  24500, stock:  8, condition: ProductCondition.nuevo, material: 'Roble',            color: 'Natural',     weight: 12, height:  55, width:  45, depth:  40, status: ProductStatus.active, daysAgo: 165 },
    { key: 'p3',  title: 'Lámpara de pie mimbre',           categoryName: 'Decoración', price:  18900, stock:  5, condition: ProductCondition.nuevo, material: 'Mimbre',           color: 'Natural',     weight:  3, height: 160, width:  40, depth:  40, status: ProductStatus.active, daysAgo: 150 },
    { key: 'p4',  title: 'Juego de sábanas king',           categoryName: 'Dormitorio', price:  32000, stock: 22, condition: ProductCondition.nuevo, material: 'Algodón',          color: 'Blanco',      weight:  1, height:   5, width:  40, depth:  30, status: ProductStatus.active, daysAgo: 140 },
    { key: 'p5',  title: 'Set de vajilla 12 pzs',           categoryName: 'Cocina',     price:  15600, stock: 14, condition: ProductCondition.nuevo, material: 'Cerámica',         color: 'Blanco',      weight:  4, height:  25, width:  40, depth:  40, status: ProductStatus.active, daysAgo: 130 },
    { key: 'p6',  title: 'Mesa redonda 4 personas',         categoryName: 'Comedor',    price:  67000, stock:  2, condition: ProductCondition.nuevo, material: 'Madera',           color: 'Natural',     weight: 30, height:  75, width: 100, depth: 100, status: ProductStatus.active, daysAgo: 125 },
    { key: 'p7',  title: 'Cortina de baño bambú',           categoryName: 'Baño',       price:   8400, stock: 30, condition: ProductCondition.nuevo, material: 'Bambú',            color: 'Natural',     weight:  1, height: 200, width: 180, depth:   1, status: ProductStatus.paused, daysAgo: 120 },
    { key: 'p8',  title: 'Reposera plegable lona',          categoryName: 'Terraza',    price:  22500, stock:  6, condition: ProductCondition.nuevo, material: 'Lona',             color: 'Beige',       weight:  8, height:  90, width:  60, depth:  80, status: ProductStatus.active, daysAgo: 115 },
    { key: 'p9',  title: 'Espejo redondo 60cm',             categoryName: 'Decoración', price:  16800, stock:  9, condition: ProductCondition.nuevo, material: 'Vidrio',           color: 'Dorado',      weight:  3, height:  60, width:  60, depth:   5, status: ProductStatus.active, daysAgo: 110 },
    { key: 'p10', title: 'Estantería pino 4 niveles',       categoryName: 'Living',     price:  38900, stock:  4, condition: ProductCondition.nuevo, material: 'Pino',             color: 'Natural',     weight: 20, height: 160, width:  80, depth:  30, status: ProductStatus.active, daysAgo: 105 },
    { key: 'p11', title: 'Pava eléctrica 1.7L',             categoryName: 'Cocina',     price:  19200, stock: 18, condition: ProductCondition.nuevo, material: 'Acero inoxidable', color: 'Plateado',    weight:  1, height:  25, width:  20, depth:  20, status: ProductStatus.paused, daysAgo: 100 },
    { key: 'p12', title: 'Almohadón lino crudo',            categoryName: 'Decoración', price:   6800, stock: 40, condition: ProductCondition.nuevo, material: 'Lino',             color: 'Crudo',       weight:  1, height:  45, width:  45, depth:  15, status: ProductStatus.active, daysAgo:  95 },
    { key: 'p13', title: 'Mesa ratona algarrobo',           categoryName: 'Living',     price:  54000, stock:  1, condition: ProductCondition.usado, material: 'Algarrobo',        color: 'Marrón',      weight: 18, height:  45, width: 110, depth:  60, status: ProductStatus.active, daysAgo:  92 },
    { key: 'p14', title: 'Cama 2 plazas con cajones',       categoryName: 'Dormitorio', price: 145000, stock:  2, condition: ProductCondition.nuevo, material: 'MDF',              color: 'Wengue',      weight: 60, height:  40, width: 200, depth: 160, status: ProductStatus.active, daysAgo:  88 },
    { key: 'p15', title: 'Silla Eames replica',             categoryName: 'Comedor',    price:  21000, stock: 12, condition: ProductCondition.nuevo, material: 'Polipropileno',    color: 'Negro',       weight:  4, height:  82, width:  46, depth:  50, status: ProductStatus.active, daysAgo:  85 },
    { key: 'p16', title: 'Olla de hierro 24cm',             categoryName: 'Cocina',     price:  28500, stock:  7, condition: ProductCondition.nuevo, material: 'Hierro fundido',   color: 'Negro',       weight:  5, height:  12, width:  24, depth:  24, status: ProductStatus.active, daysAgo:  80 },
    { key: 'p17', title: 'Toallón 90x150 algodón',          categoryName: 'Baño',       price:   9800, stock: 25, condition: ProductCondition.nuevo, material: 'Algodón',          color: 'Celeste',     weight:  1, height:   3, width:  90, depth:  60, status: ProductStatus.active, daysAgo:  75 },
    { key: 'p18', title: 'Macetero terracota grande',       categoryName: 'Terraza',    price:  12400, stock: 11, condition: ProductCondition.nuevo, material: 'Terracota',        color: 'Terracota',   weight:  6, height:  40, width:  35, depth:  35, status: ProductStatus.active, daysAgo:  70 },
    { key: 'p19', title: 'Cuadro abstracto 80x100',         categoryName: 'Decoración', price:  34500, stock:  3, condition: ProductCondition.nuevo, material: 'Lienzo',           color: 'Multicolor',  weight:  2, height:  80, width: 100, depth:   3, status: ProductStatus.paused, daysAgo:  68 },
    { key: 'p20', title: 'Biblioteca cedro 5 estantes',     categoryName: 'Living',     price:  98000, stock:  0, condition: ProductCondition.nuevo, material: 'Cedro',            color: 'Natural',     weight: 35, height: 200, width: 100, depth:  35, status: ProductStatus.active, daysAgo:  65 },
    { key: 'p21', title: 'Frazada plush queen',             categoryName: 'Dormitorio', price:  18700, stock: 16, condition: ProductCondition.nuevo, material: 'Poliéster',        color: 'Gris',        weight:  2, height:   5, width:  60, depth:  40, status: ProductStatus.active, daysAgo:  62 },
    { key: 'p22', title: 'Bandeja de madera con asas',      categoryName: 'Cocina',     price:   7900, stock: 20, condition: ProductCondition.nuevo, material: 'Pino',             color: 'Natural',     weight:  1, height:   5, width:  45, depth:  30, status: ProductStatus.active, daysAgo:  58 },
    { key: 'p23', title: 'Banco de jardín 2 cuerpos',       categoryName: 'Terraza',    price:  76000, stock:  2, condition: ProductCondition.usado, material: 'Hierro',           color: 'Verde',       weight: 28, height:  85, width: 150, depth:  60, status: ProductStatus.active, daysAgo:  55 },
    { key: 'p24', title: 'Aparador 3 puertas',              categoryName: 'Comedor',    price: 158000, stock:  1, condition: ProductCondition.nuevo, material: 'MDF',              color: 'Blanco',      weight: 50, height:  85, width: 180, depth:  45, status: ProductStatus.active, daysAgo:  50 },
    { key: 'p25', title: 'Toallero de pie',                 categoryName: 'Baño',       price:  14200, stock:  8, condition: ProductCondition.nuevo, material: 'Acero',            color: 'Cromo',       weight:  3, height: 110, width:  40, depth:  20, status: ProductStatus.active, daysAgo:  46 },
    { key: 'p26', title: 'Vela aromática lavanda',          categoryName: 'Decoración', price:   4500, stock: 50, condition: ProductCondition.nuevo, material: 'Cera de soja',     color: 'Lila',        weight:  1, height:  10, width:   8, depth:   8, status: ProductStatus.active, daysAgo:  42 },
    { key: 'p27', title: 'Alfombra yute 200x150',           categoryName: 'Living',     price:  42500, stock:  5, condition: ProductCondition.nuevo, material: 'Yute',             color: 'Natural',     weight:  6, height:   2, width: 200, depth: 150, status: ProductStatus.active, daysAgo:  38 },
    { key: 'p28', title: 'Mesita de noche vintage',         categoryName: 'Dormitorio', price:  31000, stock:  1, condition: ProductCondition.usado, material: 'Roble',            color: 'Caoba',       weight: 14, height:  60, width:  50, depth:  40, status: ProductStatus.active, daysAgo:  35 },
    { key: 'p29', title: 'Sartén antiadherente 28cm',       categoryName: 'Cocina',     price:  16800, stock: 22, condition: ProductCondition.nuevo, material: 'Aluminio',         color: 'Negro',       weight:  1, height:   8, width:  28, depth:  28, status: ProductStatus.active, daysAgo:  32 },
    { key: 'p30', title: 'Espejo de pie cuerpo entero',     categoryName: 'Dormitorio', price:  48900, stock:  0, condition: ProductCondition.nuevo, material: 'Vidrio',           color: 'Negro',       weight:  9, height: 170, width:  50, depth:   5, status: ProductStatus.active, daysAgo:  28 },
    { key: 'p31', title: 'Tablero ajedrez de madera',       categoryName: 'Decoración', price:   8900, stock: 15, condition: ProductCondition.nuevo, material: 'Madera',           color: 'Bicolor',     weight:  2, height:   4, width:  40, depth:  40, status: ProductStatus.paused, daysAgo:  25 },
    { key: 'p32', title: 'Set 4 sillas comedor',            categoryName: 'Comedor',    price:  84000, stock:  4, condition: ProductCondition.nuevo, material: 'Haya',             color: 'Natural',     weight: 24, height:  90, width:  45, depth:  50, status: ProductStatus.active, daysAgo:  22 },
    { key: 'p33', title: 'Cesto mimbre con tapa',           categoryName: 'Baño',       price:  11500, stock: 13, condition: ProductCondition.nuevo, material: 'Mimbre',           color: 'Natural',     weight:  1, height:  55, width:  35, depth:  35, status: ProductStatus.active, daysAgo:  20 },
    { key: 'p34', title: 'Sombrilla terraza 2.5m',          categoryName: 'Terraza',    price:  39800, stock:  3, condition: ProductCondition.nuevo, material: 'Aluminio + lona',  color: 'Beige',       weight:  7, height: 250, width:  50, depth:  50, status: ProductStatus.active, daysAgo:  17 },
    { key: 'p35', title: 'Lámpara de mesa industrial',      categoryName: 'Living',     price:  17400, stock: 10, condition: ProductCondition.nuevo, material: 'Hierro',           color: 'Negro',       weight:  3, height:  45, width:  20, depth:  20, status: ProductStatus.active, daysAgo:  14 },
    { key: 'p36', title: 'Juego de cubiertos 24 pzs',       categoryName: 'Cocina',     price:  22300, stock: 17, condition: ProductCondition.nuevo, material: 'Acero inoxidable', color: 'Plateado',    weight:  2, height:   5, width:  30, depth:  20, status: ProductStatus.active, daysAgo:  11 },
    { key: 'p37', title: 'Florero cerámica artesanal',      categoryName: 'Decoración', price:  13900, stock:  6, condition: ProductCondition.nuevo, material: 'Cerámica',         color: 'Azul',        weight:  2, height:  35, width:  18, depth:  18, status: ProductStatus.active, daysAgo:   8 },
    { key: 'p38', title: 'Manta de algodón tejida',         categoryName: 'Dormitorio', price:  27600, stock:  9, condition: ProductCondition.nuevo, material: 'Algodón',          color: 'Mostaza',     weight:  2, height:   8, width:  60, depth:  40, status: ProductStatus.active, daysAgo:   6 },
    { key: 'p39', title: 'Perchero de pared retro',         categoryName: 'Living',     price:   9700, stock: 21, condition: ProductCondition.nuevo, material: 'Madera + metal',   color: 'Nogal',       weight:  2, height:  15, width:  60, depth:  10, status: ProductStatus.paused, daysAgo:   4 },
    { key: 'p40', title: 'Banqueta alta de barra',          categoryName: 'Cocina',     price:  29400, stock:  8, condition: ProductCondition.nuevo, material: 'Metal + cuero',    color: 'Camel',       weight:  6, height:  75, width:  40, depth:  40, status: ProductStatus.active, daysAgo:   2 },
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
        createdAt:   daysAgo(p.daysAgo),
      },
    });
  }

  // ── Ventas ────────────────────────────────────────────────────────────────
  // Cubre los 4 SaleStatus, fechas variadas y múltiples ventas por producto.
  // Coherencia temporal: las recientes están en `paid`/`shipping`; las viejas
  // en `delivered`. `shipping_failed` aparece como caso de borde.
  // Nota: buyer-014 repite en ord-014 (pedido de varios productos) y buyer-001
  // repite en ord-035 (segunda compra) — mismos id y nombre intencionalmente.
  // `trackingCode` solo lo tienen las ventas que ya pasaron por logística
  // (shipping, delivered, shipping_failed). Las que están en `paid` lo dejan
  // null porque todavía no se disparó el envío.
  const saleSeeds = [
    { orderId: 'ord-001', productKey: 'p1',  buyerId: 'buyer-001', buyerName: 'Lucía Fernández',     paymentId: 'pay-001', amount: 1, total: 113500, fee:  6810, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-9F3K2L', daysAgo: 175 },
    { orderId: 'ord-002', productKey: 'p2',  buyerId: 'buyer-002', buyerName: 'Martín Gómez',        paymentId: 'pay-002', amount: 1, total:  24500, fee:  1470, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-7B1N8X', daysAgo: 160 },
    { orderId: 'ord-003', productKey: 'p6',  buyerId: 'buyer-003', buyerName: 'Sofía Pereyra',       paymentId: 'pay-003', amount: 1, total:  67400, fee:  4044, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-3D5M7Q', daysAgo: 145 },
    { orderId: 'ord-004', productKey: 'p3',  buyerId: 'buyer-004', buyerName: 'Tomás Rodríguez',     paymentId: 'pay-004', amount: 1, total:  18900, fee:  1134, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-2K6V9P', daysAgo: 138 },
    { orderId: 'ord-005', productKey: 'p8',  buyerId: 'buyer-005', buyerName: 'Camila López',        paymentId: 'pay-005', amount: 1, total:  41200, fee:  2472, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-8H4T1R', daysAgo: 130 },
    { orderId: 'ord-006', productKey: 'p4',  buyerId: 'buyer-006', buyerName: 'Federico Álvarez',    paymentId: 'pay-006', amount: 2, total:  64000, fee:  3840, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-5W2J6S', daysAgo: 122 },
    { orderId: 'ord-007', productKey: 'p5',  buyerId: 'buyer-007', buyerName: 'Valentina Suárez',    paymentId: 'pay-007', amount: 1, total:  15600, fee:   936, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-1L9Z3F', daysAgo: 118 },
    { orderId: 'ord-008', productKey: 'p10', buyerId: 'buyer-008', buyerName: 'Ignacio Romero',      paymentId: 'pay-008', amount: 1, total:  38900, fee:  2334, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-6Y8C4N', daysAgo: 110 },
    { orderId: 'ord-009', productKey: 'p9',  buyerId: 'buyer-009', buyerName: 'Agustina Torres',     paymentId: 'pay-009', amount: 2, total:  33600, fee:  2016, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-4G7B2H', daysAgo: 104 },
    { orderId: 'ord-010', productKey: 'p12', buyerId: 'buyer-010', buyerName: 'Mateo Benítez',       paymentId: 'pay-010', amount: 4, total:  27200, fee:  1632, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-9X3R5T', daysAgo:  98 },
    { orderId: 'ord-011', productKey: 'p13', buyerId: 'buyer-011', buyerName: 'Florencia Castro',    paymentId: 'pay-011', amount: 1, total:  54000, fee:  3240, status: SaleStatus.shipping_failed, trackingCode: 'TRK-AR-0M1Q8K', daysAgo:  90 },
    { orderId: 'ord-012', productKey: 'p14', buyerId: 'buyer-012', buyerName: 'Joaquín Méndez',      paymentId: 'pay-012', amount: 1, total: 145000, fee:  8700, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-7P5D2W', daysAgo:  85 },
    { orderId: 'ord-013', productKey: 'p15', buyerId: 'buyer-013', buyerName: 'Carolina Ríos',       paymentId: 'pay-013', amount: 4, total:  84000, fee:  5040, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-3V6L9J', daysAgo:  80 },
    // Pedido con múltiples productos (mismo orderId, varias sales).
    { orderId: 'ord-014', productKey: 'p16', buyerId: 'buyer-014', buyerName: 'Diego Sosa',          paymentId: 'pay-014', amount: 1, total:  28500, fee:  1710, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-2F8N4Y', daysAgo:  72 },
    { orderId: 'ord-014', productKey: 'p22', buyerId: 'buyer-014', buyerName: 'Diego Sosa',          paymentId: 'pay-014', amount: 1, total:   7900, fee:   474, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-2F8N4Z', daysAgo:  72 },
    { orderId: 'ord-015', productKey: 'p17', buyerId: 'buyer-015', buyerName: 'Brenda Ortiz',        paymentId: 'pay-015', amount: 3, total:  29400, fee:  1764, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-8T1H6X', daysAgo:  65 },
    { orderId: 'ord-016', productKey: 'p18', buyerId: 'buyer-016', buyerName: 'Nicolás Vega',        paymentId: 'pay-016', amount: 2, total:  24800, fee:  1488, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-5C9G3M', daysAgo:  60 },
    { orderId: 'ord-017', productKey: 'p20', buyerId: 'buyer-017', buyerName: 'Julieta Acosta',      paymentId: 'pay-017', amount: 1, total:  98000, fee:  5880, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-1B7K4P', daysAgo:  55 },
    { orderId: 'ord-018', productKey: 'p21', buyerId: 'buyer-018', buyerName: 'Pablo Herrera',       paymentId: 'pay-018', amount: 1, total:  18700, fee:  1122, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-6S2W9D', daysAgo:  48 },
    { orderId: 'ord-019', productKey: 'p23', buyerId: 'buyer-019', buyerName: 'Mariana Silva',       paymentId: 'pay-019', amount: 1, total:  76000, fee:  4560, status: SaleStatus.shipping_failed, trackingCode: 'TRK-AR-4Z5V8L', daysAgo:  42 },
    { orderId: 'ord-020', productKey: 'p24', buyerId: 'buyer-020', buyerName: 'Esteban Molina',      paymentId: 'pay-020', amount: 1, total: 158000, fee:  9480, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-9R3J7C', daysAgo:  38 },
    { orderId: 'ord-021', productKey: 'p25', buyerId: 'buyer-021', buyerName: 'Renata Villalba',     paymentId: 'pay-021', amount: 1, total:  14200, fee:   852, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-7N1Q5B', daysAgo:  33 },
    { orderId: 'ord-022', productKey: 'p26', buyerId: 'buyer-022', buyerName: 'Lucas Aguirre',       paymentId: 'pay-022', amount: 6, total:  27000, fee:  1620, status: SaleStatus.delivered,       trackingCode: 'TRK-AR-2M8H6F', daysAgo:  28 },
    { orderId: 'ord-023', productKey: 'p27', buyerId: 'buyer-023', buyerName: 'Antonella Paz',       paymentId: 'pay-023', amount: 1, total:  42500, fee:  2550, status: SaleStatus.shipping,        trackingCode: 'TRK-AR-3K9D2T', daysAgo:  21 },
    { orderId: 'ord-024', productKey: 'p28', buyerId: 'buyer-024', buyerName: 'Ramiro Carrizo',      paymentId: 'pay-024', amount: 1, total:  31000, fee:  1860, status: SaleStatus.shipping,        trackingCode: 'TRK-AR-8L4P7R', daysAgo:  18 },
    { orderId: 'ord-025', productKey: 'p29', buyerId: 'buyer-025', buyerName: 'Daniela Méndez',      paymentId: 'pay-025', amount: 2, total:  33600, fee:  2016, status: SaleStatus.shipping,        trackingCode: 'TRK-AR-5J6V1Y', daysAgo:  15 },
    { orderId: 'ord-026', productKey: 'p32', buyerId: 'buyer-026', buyerName: 'Gonzalo Ferreyra',    paymentId: 'pay-026', amount: 1, total:  84000, fee:  5040, status: SaleStatus.shipping,        trackingCode: 'TRK-AR-1W7B3X', daysAgo:  12 },
    { orderId: 'ord-027', productKey: 'p33', buyerId: 'buyer-027', buyerName: 'Bianca Núñez',        paymentId: 'pay-027', amount: 1, total:  11500, fee:   690, status: SaleStatus.shipping,        trackingCode: 'TRK-AR-6Q2C9G', daysAgo:  10 },
    { orderId: 'ord-028', productKey: 'p34', buyerId: 'buyer-028', buyerName: 'Emilio Quiroga',      paymentId: 'pay-028', amount: 1, total:  39800, fee:  2388, status: SaleStatus.paid,            trackingCode: null,            daysAgo:   7 },
    { orderId: 'ord-029', productKey: 'p35', buyerId: 'buyer-029', buyerName: 'Micaela Ibarra',      paymentId: 'pay-029', amount: 2, total:  34800, fee:  2088, status: SaleStatus.paid,            trackingCode: null,            daysAgo:   5 },
    // Mismo producto vendido varias veces.
    { orderId: 'ord-030', productKey: 'p36', buyerId: 'buyer-030', buyerName: 'Hernán Cabrera',      paymentId: 'pay-030', amount: 1, total:  22300, fee:  1338, status: SaleStatus.paid,            trackingCode: null,            daysAgo:   4 },
    { orderId: 'ord-031', productKey: 'p36', buyerId: 'buyer-031', buyerName: 'Paula Domínguez',     paymentId: 'pay-031', amount: 1, total:  22300, fee:  1338, status: SaleStatus.paid,            trackingCode: null,            daysAgo:   3 },
    { orderId: 'ord-032', productKey: 'p37', buyerId: 'buyer-032', buyerName: 'Santiago Bravo',      paymentId: 'pay-032', amount: 1, total:  13900, fee:   834, status: SaleStatus.paid,            trackingCode: null,            daysAgo:   2 },
    { orderId: 'ord-033', productKey: 'p38', buyerId: 'buyer-033', buyerName: 'Rocío Maldonado',     paymentId: 'pay-033', amount: 1, total:  27600, fee:  1656, status: SaleStatus.paid,            trackingCode: null,            daysAgo:   1 },
    { orderId: 'ord-034', productKey: 'p40', buyerId: 'buyer-034', buyerName: 'Gastón Rivero',       paymentId: 'pay-034', amount: 2, total:  58800, fee:  3528, status: SaleStatus.paid,            trackingCode: null,            daysAgo:   1 },
    // buyer-001 repite: segunda compra del mismo cliente.
    { orderId: 'ord-035', productKey: 'p1',  buyerId: 'buyer-001', buyerName: 'Lucía Fernández',     paymentId: 'pay-035', amount: 1, total:  89000, fee:  5340, status: SaleStatus.paid,            trackingCode: null,            daysAgo:   0 },
  ];

  for (const s of saleSeeds) {
    await prisma.sale.create({
      data: {
        id:        newId(PREFIXES.sale),
        orderId:   s.orderId,
        productId: productIdByKey.get(s.productKey)!,
        sellerId,
        buyerId:   s.buyerId,
        buyerName: s.buyerName,
        paymentId: s.paymentId,
        amount:    s.amount,
        total:     s.total,
        fee:       s.fee,
        status:    s.status,
        trackingCode: s.trackingCode,
        createdAt: daysAgo(s.daysAgo),
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
