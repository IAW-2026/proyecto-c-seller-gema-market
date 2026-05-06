# Auth (Clerk)

La autenticación del proyecto se gestiona con Clerk (servicio centralizado para todas las webapps de la comisión, según enunciado).

## Wiring pendiente

1. Instalar `@clerk/nextjs`:
   ```sh
   npm i @clerk/nextjs
   ```
2. Configurar variables en `.env.local` (ver `.env.example`).
3. Envolver `app/layout.tsx` con `<ClerkProvider>`.
4. Crear `middleware.ts` con `clerkMiddleware()` para proteger rutas privadas.
5. Reemplazar `lib/current-seller.ts` por una función que lea el usuario autenticado de Clerk
   y resuelva el `Seller` por `clerkUserId`.

Mientras tanto, `getCurrentSeller()` delega en `getDefaultSeller()`, que devuelve el
primer seller seedeado en la DB. Esto permite desarrollar el frontend sin Clerk
configurado, pero ya corriendo contra Postgres real.
