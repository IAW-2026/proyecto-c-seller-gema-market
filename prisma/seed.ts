// Seed inicial de desarrollo.
// Genera ULIDs prefijados (`usr_`, `cat_`, `prd_`, `vnt_`, `rsv_`) en cada corrida.
// Para regenerar de cero: `npx prisma migrate reset --force`.
//
// Sube imágenes de prueba a Supabase Storage. Para que las fotos sean
// específicas del producto buscamos en Pexels API por keyword (ver
// `searchQuery` en cada productSeed). Pexels devuelve la lista ranqueada por
// relevancia; tomamos las primeras 3 fotos como thumbnail + galería.
//
// Los paths son determinísticos (`sellers/{SEED_SELLER_ID}/cover.jpg`, etc.)
// y `upsert: true` los sobreescribe; un cachebuster `?v=SEED_VERSION` se
// agrega al URL guardado en DB para invalidar cache de browser/CDN entre
// corridas. Requiere `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY` y
// `PEXELS_API_KEY` (gratis en https://www.pexels.com/api/) en `.env`.

import 'dotenv/config';
import { PrismaClient, ProductStatus, ProductCondition, SaleStatus } from '../lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from '@supabase/supabase-js';
import { newId, PREFIXES } from '../lib/ids';

// El driver adapter (`pg`) ignora el `?schema=` de la connection string; hay que
// pasarlo explícitamente o las queries corren contra `public`.
const schema = new URL(process.env.DATABASE_URL!).searchParams.get('schema') ?? undefined;
const adapter = new PrismaPg(
  { connectionString: process.env.DATABASE_URL! },
  schema ? { schema } : undefined,
);
const prisma = new PrismaClient({ adapter });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
if (!SUPABASE_URL || !SUPABASE_SECRET) {
  throw new Error(
    'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env. El seed sube imágenes de prueba a Supabase Storage.',
  );
}
if (!PEXELS_API_KEY) {
  throw new Error(
    'Falta PEXELS_API_KEY en .env. Conseguila gratis en https://www.pexels.com/api/ — el seed busca por keyword para encontrar fotos relacionadas a cada producto.',
  );
}

const BUCKET = 'gema-market';
// ULID hardcodeado para el seller del seed. Caracteres válidos en Crockford
// base32 (sin I/L/O/U). Mantenerlo fijo permite que los paths del bucket sean
// estables entre corridas y que `upsert: true` sobreescriba en lugar de dejar
// huérfanos.
const SEED_SELLER_ID = 'usr_01JNAQX9KFAQH8B5HM7XJ4WGRJ';
// Cachebuster que cambia cada corrida del seed. Se agrega como query param a
// las URLs guardadas en DB para que el browser y el CDN de Supabase invaliden
// caches viejos cuando el archivo en el bucket se sobreescribe (mismo path
// pero contenido nuevo).
const SEED_VERSION = Date.now().toString();

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

// Baja una imagen externa y la sube al bucket en `path`. `upsert: true`
// permite re-correr el seed sin acumular archivos. Devuelve la URL pública
// con un cachebuster `?v=SEED_VERSION` para que un re-seed cambie el URL
// guardado en DB e invalide cache de browser / CDN.
async function uploadFromUrl(externalUrl: string, path: string): Promise<string> {
  const res = await fetch(externalUrl, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Fetch ${externalUrl} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType: 'image/jpeg',
    cacheControl: '3600',
    upsert: true,
  });
  if (error) throw new Error(`Upload ${path} → ${error.message}`);
  const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  return `${publicUrl}?v=${SEED_VERSION}`;
}

// Pexels search: devuelve URLs de las primeras `count` fotos para un keyword.
// Pexels permite hotlinking gratuito; nosotros descargamos y subimos a
// Supabase Storage para que la app no dependa del CDN externo en runtime.
// Lanza si el search no devuelve resultados — así el seed falla loud y se
// puede ajustar el `searchQuery` del producto problemático.
type PexelsPhoto = { src: { large2x?: string; large?: string; medium?: string } };
async function pexelsSearchUrls(query: string, count: number): Promise<string[]> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY! } });
  if (!res.ok) throw new Error(`Pexels "${query}" → ${res.status}`);
  const data = (await res.json()) as { photos: PexelsPhoto[] };
  // `large2x` es ~1880x1250 (alta), `large` ~940x625, `medium` ~350x230.
  // Tomamos la mejor disponible.
  const urls = data.photos
    .map((p) => p.src.large2x ?? p.src.large ?? p.src.medium)
    .filter((u): u is string => typeof u === 'string');
  if (urls.length === 0) {
    throw new Error(`Pexels: sin resultados para "${query}". Cambiá el searchQuery del producto.`);
  }
  return urls;
}

// Picsum: foto random con seed determinística. Solo se usa para el logo del
// seller (un avatar abstracto no necesita relación temática).
function picsumUrl(seed: string, w: number, h: number): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

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
  console.log('Subiendo imágenes del seller…');
  // Cover: primera foto que Pexels devuelva buscando "carpentry workshop".
  // `pexelsSearchUrls` lanza si no hay resultados, así que `[0]` es seguro.
  const [sellerCoverPhoto] = await pexelsSearchUrls('carpentry workshop wood', 1);
  const [coverUrl, logoUrl] = await Promise.all([
    uploadFromUrl(sellerCoverPhoto!, `sellers/${SEED_SELLER_ID}/cover.jpg`),
    // Logo: pattern abstracto random — un avatar circular no necesita relación
    // temática y Pexels tampoco devuelve "logos" diseñados.
    uploadFromUrl(
      picsumUrl(`seller-logo-${SEED_SELLER_ID}`, 400, 400),
      `sellers/${SEED_SELLER_ID}/logo.jpg`,
    ),
  ]);

  await prisma.seller.create({
    data: {
      id: SEED_SELLER_ID,
      clerkUserId: 'user_3EV5ASyAkRn8krDifQhfjRCKXjO',
      shopName: 'Carpintería Sur',
      email: 'seller_no_admin+clerk_test@unihousing.com',
      phone: '+54 291 412 5678',
      bio: 'Taller de muebles a medida en Bahía Blanca. Trabajamos con maderas locales desde 2008.',
      city: 'Bahía Blanca',
      street: 'Av. Alem',
      number: '1200',
      postalCode: '8000',
      coverUrl,
      logoUrl,
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
  // `searchQuery`: keyword (en inglés, mejor catálogo en Pexels) que se manda
  // a la API. Pexels devuelve fotos ranqueadas por relevancia y tomamos las
  // primeras 3. Si para algún producto el primer resultado no representa
  // bien, ajustar el query y re-correr.
  const productSeeds = [
    { key: 'p1',  title: 'Sillón de pana 2 cuerpos',        categoryName: 'Living',     searchQuery: 'green velvet sofa',          price:  89000, stock:  3, condition: ProductCondition.usado, material: 'Pana',             color: 'Verde oliva', weight: 45, height:  90, width: 180, depth:  85, status: ProductStatus.active, daysAgo: 180 },
    { key: 'p2',  title: 'Mesa de luz roble',               categoryName: 'Dormitorio', searchQuery: 'wooden nightstand',          price:  24500, stock:  8, condition: ProductCondition.nuevo, material: 'Roble',            color: 'Natural',     weight: 12, height:  55, width:  45, depth:  40, status: ProductStatus.active, daysAgo: 165 },
    { key: 'p3',  title: 'Lámpara de pie mimbre',           categoryName: 'Decoración', searchQuery: 'rattan floor lamp',          price:  18900, stock:  5, condition: ProductCondition.nuevo, material: 'Mimbre',           color: 'Natural',     weight:  3, height: 160, width:  40, depth:  40, status: ProductStatus.active, daysAgo: 150 },
    { key: 'p4',  title: 'Juego de sábanas king',           categoryName: 'Dormitorio', searchQuery: 'white bed sheets',           price:  32000, stock: 22, condition: ProductCondition.nuevo, material: 'Algodón',          color: 'Blanco',      weight:  1, height:   5, width:  40, depth:  30, status: ProductStatus.active, daysAgo: 140 },
    { key: 'p5',  title: 'Set de vajilla 12 pzs',           categoryName: 'Cocina',     searchQuery: 'ceramic dinnerware set',     price:  15600, stock: 14, condition: ProductCondition.nuevo, material: 'Cerámica',         color: 'Blanco',      weight:  4, height:  25, width:  40, depth:  40, status: ProductStatus.active, daysAgo: 130 },
    { key: 'p6',  title: 'Mesa redonda 4 personas',         categoryName: 'Comedor',    searchQuery: 'round wooden dining table',  price:  67000, stock:  2, condition: ProductCondition.nuevo, material: 'Madera',           color: 'Natural',     weight: 30, height:  75, width: 100, depth: 100, status: ProductStatus.active, daysAgo: 125 },
    { key: 'p7',  title: 'Cortina de baño bambú',           categoryName: 'Baño',       searchQuery: 'bamboo shower curtain',      price:   8400, stock: 30, condition: ProductCondition.nuevo, material: 'Bambú',            color: 'Natural',     weight:  1, height: 200, width: 180, depth:   1, status: ProductStatus.paused, daysAgo: 120 },
    { key: 'p8',  title: 'Reposera plegable lona',          categoryName: 'Terraza',    searchQuery: 'canvas deck chair',          price:  22500, stock:  6, condition: ProductCondition.nuevo, material: 'Lona',             color: 'Beige',       weight:  8, height:  90, width:  60, depth:  80, status: ProductStatus.active, daysAgo: 115 },
    { key: 'p9',  title: 'Espejo redondo 60cm',             categoryName: 'Decoración', searchQuery: 'round wall mirror',          price:  16800, stock:  9, condition: ProductCondition.nuevo, material: 'Vidrio',           color: 'Dorado',      weight:  3, height:  60, width:  60, depth:   5, status: ProductStatus.active, daysAgo: 110 },
    { key: 'p10', title: 'Estantería pino 4 niveles',       categoryName: 'Living',     searchQuery: 'pine wood bookshelf',        price:  38900, stock:  4, condition: ProductCondition.nuevo, material: 'Pino',             color: 'Natural',     weight: 20, height: 160, width:  80, depth:  30, status: ProductStatus.active, daysAgo: 105 },
    { key: 'p11', title: 'Pava eléctrica 1.7L',             categoryName: 'Cocina',     searchQuery: 'electric kettle',            price:  19200, stock: 18, condition: ProductCondition.nuevo, material: 'Acero inoxidable', color: 'Plateado',    weight:  1, height:  25, width:  20, depth:  20, status: ProductStatus.paused, daysAgo: 100 },
    { key: 'p12', title: 'Almohadón lino crudo',            categoryName: 'Decoración', searchQuery: 'linen cushion pillow',       price:   6800, stock: 40, condition: ProductCondition.nuevo, material: 'Lino',             color: 'Crudo',       weight:  1, height:  45, width:  45, depth:  15, status: ProductStatus.active, daysAgo:  95 },
    { key: 'p13', title: 'Mesa ratona algarrobo',           categoryName: 'Living',     searchQuery: 'wooden coffee table',        price:  54000, stock:  1, condition: ProductCondition.usado, material: 'Algarrobo',        color: 'Marrón',      weight: 18, height:  45, width: 110, depth:  60, status: ProductStatus.active, daysAgo:  92 },
    { key: 'p14', title: 'Cama 2 plazas con cajones',       categoryName: 'Dormitorio', searchQuery: 'double bed bedroom',         price: 145000, stock:  2, condition: ProductCondition.nuevo, material: 'MDF',              color: 'Wengue',      weight: 60, height:  40, width: 200, depth: 160, status: ProductStatus.active, daysAgo:  88 },
    { key: 'p15', title: 'Silla Eames replica',             categoryName: 'Comedor',    searchQuery: 'eames chair',                price:  21000, stock: 12, condition: ProductCondition.nuevo, material: 'Polipropileno',    color: 'Negro',       weight:  4, height:  82, width:  46, depth:  50, status: ProductStatus.active, daysAgo:  85 },
    { key: 'p16', title: 'Olla de hierro 24cm',             categoryName: 'Cocina',     searchQuery: 'cast iron pot',              price:  28500, stock:  7, condition: ProductCondition.nuevo, material: 'Hierro fundido',   color: 'Negro',       weight:  5, height:  12, width:  24, depth:  24, status: ProductStatus.active, daysAgo:  80 },
    { key: 'p17', title: 'Toallón 90x150 algodón',          categoryName: 'Baño',       searchQuery: 'folded bath towels',         price:   9800, stock: 25, condition: ProductCondition.nuevo, material: 'Algodón',          color: 'Celeste',     weight:  1, height:   3, width:  90, depth:  60, status: ProductStatus.active, daysAgo:  75 },
    { key: 'p18', title: 'Macetero terracota grande',       categoryName: 'Terraza',    searchQuery: 'terracotta plant pot',       price:  12400, stock: 11, condition: ProductCondition.nuevo, material: 'Terracota',        color: 'Terracota',   weight:  6, height:  40, width:  35, depth:  35, status: ProductStatus.active, daysAgo:  70 },
    { key: 'p19', title: 'Cuadro abstracto 80x100',         categoryName: 'Decoración', searchQuery: 'abstract painting canvas',   price:  34500, stock:  3, condition: ProductCondition.nuevo, material: 'Lienzo',           color: 'Multicolor',  weight:  2, height:  80, width: 100, depth:   3, status: ProductStatus.paused, daysAgo:  68 },
    { key: 'p20', title: 'Biblioteca cedro 5 estantes',     categoryName: 'Living',     searchQuery: 'tall wooden bookcase',       price:  98000, stock:  0, condition: ProductCondition.nuevo, material: 'Cedro',            color: 'Natural',     weight: 35, height: 200, width: 100, depth:  35, status: ProductStatus.active, daysAgo:  65 },
    { key: 'p21', title: 'Frazada plush queen',             categoryName: 'Dormitorio', searchQuery: 'gray fleece blanket bed',    price:  18700, stock: 16, condition: ProductCondition.nuevo, material: 'Poliéster',        color: 'Gris',        weight:  2, height:   5, width:  60, depth:  40, status: ProductStatus.active, daysAgo:  62 },
    { key: 'p22', title: 'Bandeja de madera con asas',      categoryName: 'Cocina',     searchQuery: 'wooden serving tray',        price:   7900, stock: 20, condition: ProductCondition.nuevo, material: 'Pino',             color: 'Natural',     weight:  1, height:   5, width:  45, depth:  30, status: ProductStatus.active, daysAgo:  58 },
    { key: 'p23', title: 'Banco de jardín 2 cuerpos',       categoryName: 'Terraza',    searchQuery: 'green garden bench',         price:  76000, stock:  2, condition: ProductCondition.usado, material: 'Hierro',           color: 'Verde',       weight: 28, height:  85, width: 150, depth:  60, status: ProductStatus.active, daysAgo:  55 },
    { key: 'p24', title: 'Aparador 3 puertas',              categoryName: 'Comedor',    searchQuery: 'white sideboard cabinet',    price: 158000, stock:  1, condition: ProductCondition.nuevo, material: 'MDF',              color: 'Blanco',      weight: 50, height:  85, width: 180, depth:  45, status: ProductStatus.active, daysAgo:  50 },
    { key: 'p25', title: 'Toallero de pie',                 categoryName: 'Baño',       searchQuery: 'chrome towel rack',          price:  14200, stock:  8, condition: ProductCondition.nuevo, material: 'Acero',            color: 'Cromo',       weight:  3, height: 110, width:  40, depth:  20, status: ProductStatus.active, daysAgo:  46 },
    { key: 'p26', title: 'Vela aromática lavanda',          categoryName: 'Decoración', searchQuery: 'lavender scented candle',    price:   4500, stock: 50, condition: ProductCondition.nuevo, material: 'Cera de soja',     color: 'Lila',        weight:  1, height:  10, width:   8, depth:   8, status: ProductStatus.active, daysAgo:  42 },
    { key: 'p27', title: 'Alfombra yute 200x150',           categoryName: 'Living',     searchQuery: 'jute area rug',              price:  42500, stock:  5, condition: ProductCondition.nuevo, material: 'Yute',             color: 'Natural',     weight:  6, height:   2, width: 200, depth: 150, status: ProductStatus.active, daysAgo:  38 },
    { key: 'p28', title: 'Mesita de noche vintage',         categoryName: 'Dormitorio', searchQuery: 'vintage nightstand',         price:  31000, stock:  1, condition: ProductCondition.usado, material: 'Roble',            color: 'Caoba',       weight: 14, height:  60, width:  50, depth:  40, status: ProductStatus.active, daysAgo:  35 },
    { key: 'p29', title: 'Sartén antiadherente 28cm',       categoryName: 'Cocina',     searchQuery: 'frying pan skillet',         price:  16800, stock: 22, condition: ProductCondition.nuevo, material: 'Aluminio',         color: 'Negro',       weight:  1, height:   8, width:  28, depth:  28, status: ProductStatus.active, daysAgo:  32 },
    { key: 'p30', title: 'Espejo de pie cuerpo entero',     categoryName: 'Dormitorio', searchQuery: 'full length floor mirror',   price:  48900, stock:  0, condition: ProductCondition.nuevo, material: 'Vidrio',           color: 'Negro',       weight:  9, height: 170, width:  50, depth:   5, status: ProductStatus.active, daysAgo:  28 },
    { key: 'p31', title: 'Tablero ajedrez de madera',       categoryName: 'Decoración', searchQuery: 'wooden chess board',         price:   8900, stock: 15, condition: ProductCondition.nuevo, material: 'Madera',           color: 'Bicolor',     weight:  2, height:   4, width:  40, depth:  40, status: ProductStatus.paused, daysAgo:  25 },
    { key: 'p32', title: 'Set 4 sillas comedor',            categoryName: 'Comedor',    searchQuery: 'set dining chairs',          price:  84000, stock:  4, condition: ProductCondition.nuevo, material: 'Haya',             color: 'Natural',     weight: 24, height:  90, width:  45, depth:  50, status: ProductStatus.active, daysAgo:  22 },
    { key: 'p33', title: 'Cesto mimbre con tapa',           categoryName: 'Baño',       searchQuery: 'wicker basket with lid',     price:  11500, stock: 13, condition: ProductCondition.nuevo, material: 'Mimbre',           color: 'Natural',     weight:  1, height:  55, width:  35, depth:  35, status: ProductStatus.active, daysAgo:  20 },
    { key: 'p34', title: 'Sombrilla terraza 2.5m',          categoryName: 'Terraza',    searchQuery: 'patio umbrella',             price:  39800, stock:  3, condition: ProductCondition.nuevo, material: 'Aluminio + lona',  color: 'Beige',       weight:  7, height: 250, width:  50, depth:  50, status: ProductStatus.active, daysAgo:  17 },
    { key: 'p35', title: 'Lámpara de mesa industrial',      categoryName: 'Living',     searchQuery: 'industrial table lamp',      price:  17400, stock: 10, condition: ProductCondition.nuevo, material: 'Hierro',           color: 'Negro',       weight:  3, height:  45, width:  20, depth:  20, status: ProductStatus.active, daysAgo:  14 },
    { key: 'p36', title: 'Juego de cubiertos 24 pzs',       categoryName: 'Cocina',     searchQuery: 'silverware cutlery set',     price:  22300, stock: 17, condition: ProductCondition.nuevo, material: 'Acero inoxidable', color: 'Plateado',    weight:  2, height:   5, width:  30, depth:  20, status: ProductStatus.active, daysAgo:  11 },
    { key: 'p37', title: 'Florero cerámica artesanal',      categoryName: 'Decoración', searchQuery: 'blue ceramic vase',          price:  13900, stock:  6, condition: ProductCondition.nuevo, material: 'Cerámica',         color: 'Azul',        weight:  2, height:  35, width:  18, depth:  18, status: ProductStatus.active, daysAgo:   8 },
    { key: 'p38', title: 'Manta de algodón tejida',         categoryName: 'Dormitorio', searchQuery: 'knitted throw blanket',      price:  27600, stock:  9, condition: ProductCondition.nuevo, material: 'Algodón',          color: 'Mostaza',     weight:  2, height:   8, width:  60, depth:  40, status: ProductStatus.active, daysAgo:   6 },
    { key: 'p39', title: 'Perchero de pared retro',         categoryName: 'Living',     searchQuery: 'wall coat rack',             price:   9700, stock: 21, condition: ProductCondition.nuevo, material: 'Madera + metal',   color: 'Nogal',       weight:  2, height:  15, width:  60, depth:  10, status: ProductStatus.paused, daysAgo:   4 },
    { key: 'p40', title: 'Banqueta alta de barra',          categoryName: 'Cocina',     searchQuery: 'leather bar stool',          price:  29400, stock:  8, condition: ProductCondition.nuevo, material: 'Metal + cuero',    color: 'Camel',       weight:  6, height:  75, width:  40, depth:  40, status: ProductStatus.active, daysAgo:   2 },
  ];

  console.log(`Subiendo imágenes de ${productSeeds.length} productos (1 thumbnail + 2 galería c/u)…`);
  const productIdByKey = new Map<string, string>();
  for (const [idx, p] of productSeeds.entries()) {
    // Pedimos hasta 5 resultados de Pexels y tomamos 3 fotos distintas. Si el
    // search devuelve menos, repetimos la primera como fallback. Las 3 fotos
    // son del mismo keyword pero distintas entre sí — variación natural.
    const photos = await pexelsSearchUrls(p.searchQuery, 5);
    // `pexelsSearchUrls` lanza si no hay fotos, así que `photos[0]` está
    // garantizado. El non-null `!` evita que TS exija más checks.
    const pick = (i: number): string => photos[i] ?? photos[0]!;
    const [thumbnailUrl, gallery0, gallery1] = await Promise.all([
      uploadFromUrl(pick(0), `products/${SEED_SELLER_ID}/${p.key}-thumb.jpg`),
      uploadFromUrl(pick(1), `products/${SEED_SELLER_ID}/${p.key}-g0.jpg`),
      uploadFromUrl(pick(2), `products/${SEED_SELLER_ID}/${p.key}-g1.jpg`),
    ]);

    const id = newId(PREFIXES.product);
    productIdByKey.set(p.key, id);
    await prisma.product.create({
      data: {
        id,
        sellerId: SEED_SELLER_ID,
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
        thumbnailUrl,
        images:      [gallery0, gallery1],
        createdAt:   daysAgo(p.daysAgo),
      },
    });
    console.log(`  [${(idx + 1).toString().padStart(2, ' ')}/${productSeeds.length}] ${p.title}`);
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
        sellerId:  SEED_SELLER_ID,
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

  // ── Sellers extra (para que el panel admin tenga datos significativos) ──────
  // Filas de DB sin cuenta real de Clerk. Sus productos usan thumbnails de
  // Picsum directos (sin el pipeline de Pexels/Supabase) para mantener el seed
  // liviano. Uno de los sellers queda suspendido y un producto de otro queda
  // oculto por admin, para demostrar la moderación del panel admin.
  const extraSellers = [
    { clerkUserId: 'seed_extra_norte',   shopName: 'Maderas del Norte', email: 'norte@gemamarket.test',   city: 'Salta',   suspended: false },
    { clerkUserId: 'seed_extra_litoral', shopName: 'Deco Litoral',      email: 'litoral@gemamarket.test', city: 'Rosario', suspended: false },
    { clerkUserId: 'seed_extra_revend',  shopName: 'Revende Express',   email: 'revende@gemamarket.test', city: 'Córdoba', suspended: true  },
  ];

  let extraProductCount = 0;
  let extraSaleCount = 0;
  for (const [si, es] of extraSellers.entries()) {
    const sellerId = newId(PREFIXES.seller);
    await prisma.seller.create({
      data: {
        id: sellerId,
        clerkUserId: es.clerkUserId,
        shopName: es.shopName,
        email: es.email,
        phone: `+54 9 11 5000 100${si}`,
        bio: null,
        suspended: es.suspended,
        city: es.city,
        street: 'Av. Siempre Viva',
        number: String(100 + si),
        postalCode: '5000',
        logoUrl: picsumUrl(`logo-${es.clerkUserId}`, 200, 200),
        coverUrl: null,
      },
    });

    for (let pi = 0; pi < 3; pi++) {
      const catName = categoryNames[(si + pi) % categoryNames.length]!;
      const productId = newId(PREFIXES.product);
      // Un producto oculto por admin en un seller NO suspendido, para demostrar
      // que la moderación de productos es independiente de la de tiendas.
      const hiddenByAdmin = si === 1 && pi === 0;
      await prisma.product.create({
        data: {
          id: productId,
          sellerId,
          title: `${catName} — ${es.shopName} #${pi + 1}`,
          description: '',
          weight: 5,
          height: 50,
          width: 50,
          depth: 40,
          condition: ProductCondition.nuevo,
          material: 'Madera',
          color: 'Natural',
          price: 12000 + si * 5000 + pi * 3000,
          currency: 'ARS',
          categoryId: catIdByName.get(catName)!,
          stock: 5 + pi,
          status: ProductStatus.active,
          hiddenByAdmin,
          thumbnailUrl: picsumUrl(`prod-${sellerId}-${pi}`, 800, 600),
          images: [
            picsumUrl(`prod-${sellerId}-${pi}-g0`, 800, 600),
            picsumUrl(`prod-${sellerId}-${pi}-g1`, 800, 600),
          ],
          createdAt: daysAgo(30 - si * 5 - pi),
        },
      });
      extraProductCount++;

      // Una venta entregada por seller (sobre su primer producto) para que el
      // reporte global de ventas y los conteos del admin no queden vacíos.
      if (pi === 0) {
        await prisma.sale.create({
          data: {
            id: newId(PREFIXES.sale),
            orderId: `ord-extra-${si + 1}`,
            productId,
            sellerId,
            buyerId: `buyer-extra-${si + 1}`,
            buyerName: 'Cliente Demo',
            paymentId: `pay-extra-${si + 1}`,
            amount: 1,
            total: 12000 + si * 5000,
            fee: 720,
            status: SaleStatus.delivered,
            trackingCode: `TRK-AR-EXTRA${si + 1}`,
            createdAt: daysAgo(20 - si * 3),
          },
        });
        extraSaleCount++;
      }
    }
  }

  console.log(
    `Seed completo: ${1 + extraSellers.length} sellers (1 suspendido), ${categoryNames.length} categorías, ${productSeeds.length + extraProductCount} productos (1 oculto por admin), ${saleSeeds.length + extraSaleCount} ventas.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
