[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/ADcDbJbt)

# UniHousing — Seller App

App del vendedor del marketplace **UniHousing** — [Proyecto IAW 2026](https://iaw-2026.github.io/proyecto/)

## Deploy de producción

<https://proyecto-c-seller-gema-market.vercel.app>

## Usuarios de prueba

Ingresá en `/sign-in` con cualquiera de estas cuentas:

| Rol | Email | Contraseña |
|---|---|---|
| Vendedor (`seller`) | `seller.user+clerk_test@iaw.com` | `iawuser#` |
| Administrador (`seller_admin`) | `seller.admin+clerk_test@iaw.com` | `iawuser#` |

Son cuentas de prueba de Clerk: si algún flujo pide código de verificación, usá **`424242`**.

## Instrucciones para evaluar

Tras el login, `/` redirige según el rol:

- **`seller`** (por defecto): panel del vendedor — publicaciones, pedidos, stock y tienda.
- **`seller_admin`**: panel `/admin` — categorías, moderación de tiendas y productos, métricas y ventas.

Para evaluar contra el deploy de producción alcanza con ingresar con los usuarios de prueba.

### Setup local (opcional)

Requiere Node 20+ y PostgreSQL.

```bash
npm install
cp .env.example .env    # completar al menos DATABASE_URL
npm run db:migrate      # crea el schema
npm run db:seed         # carga datos de prueba
npm run dev             # http://localhost:3000
```

El seed incluye varias tiendas (una suspendida) y un producto oculto, para que el panel admin tenga datos que moderar desde el arranque.

Para hacer admin a un usuario: `npx tsx scripts/set-admin.ts <email>` (requiere `CLERK_SECRET_KEY`; agregá `--revoke` para revertir).

Scripts disponibles: `dev` · `build` · `lint` · `typecheck` · `test` (Vitest) · `db:migrate` · `db:seed` · `db:studio`.

## Descripción del proyecto

UniHousing Seller es el panel del vendedor de un marketplace. Permite publicar y moderar productos, gestionar stock y precios, administrar la tienda y dar seguimiento a los pedidos desde la reserva hasta el despacho. El acceso está separado en dos roles: el vendedor opera su propia tienda y el administrador modera tiendas y productos de toda la plataforma.

Está construido con Next.js 16 (App Router), React 19, TypeScript, Prisma 7 sobre PostgreSQL y Clerk para autenticación y manejo de roles. El despliegue corre en Vercel, con almacenamiento de imágenes en Supabase Storage.

El flujo de compra contempla reserva de stock atómica con expiración por TTL, confirmación de pago e integración con un servicio externo de envíos para obtener el `tracking_code` al despachar. La API pública está cubierta por suites de tests de integración que corren contra un Postgres real.

## Notas para la corrección

Aspectos y decisiones que vale la pena destacar:

- **Asistente con IA en el alta de productos.** El botón "Completar con IA" manda el título y las fotos a un modelo (Claude vía Vercel AI Gateway) que infiere descripción, material, color, condición y categoría sugerida. La salida se valida contra un schema y se descartan categorías inexistentes antes de aplicarlas.
- **Seed con fotos reales y coherentes.** Cada producto define un `searchQuery` y el seed busca en la **API de Pexels** fotos relacionadas, las descarga y las sube a Supabase Storage (thumbnail + galería). El catálogo de demo queda con imágenes que matchean cada producto, no placeholders.
- **Reserva de stock atómica con expiración.** El endpoint de reserva descuenta stock de forma atómica (sin sobreventa bajo concurrencia); las reservas vencen por TTL y se liberan con un cron diario de Vercel más un *lazy sweep* al intentar comprar.
- **Integración con API externa (Shipping).** Al despachar un pedido se hace un request real al servicio de envíos (URL configurable por env) y se procesa el `tracking_code`.
- **Tests de la API.** 13 suites de Vitest corriendo contra un Postgres real (schema dedicado de test): cubren los contratos públicos (productos, reservas, pagos confirmados, estado de envío, tiendas, categorías), el barrido de reservas vencidas, la moderación del admin y un smoke end-to-end del flujo completo.
- **Rendimiento y UX.** Partial Prerendering (`cacheComponents`), CSS inlineado, `next/image` y skeletons de carga; panel responsive con navegación adaptada a mobile.
