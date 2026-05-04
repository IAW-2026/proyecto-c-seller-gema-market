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
   y traiga el `Seller` desde la base.

Mientras tanto, `getCurrentSeller()` devuelve datos mock para que el frontend se pueda
desarrollar sin Clerk.
