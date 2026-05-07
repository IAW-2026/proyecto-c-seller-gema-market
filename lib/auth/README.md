# Auth (Clerk)

La autenticación del proyecto se gestiona con Clerk. La fuente de verdad del usuario es Clerk; en la DB mantenemos un `Seller` cacheado por `clerkUserId`.

## Wiring actual

- `proxy.ts` (root) usa `clerkMiddleware()`. Rutas públicas: `/sign-in(.*)`, `/sign-up(.*)`. Todo lo demás requiere sesión.
- `app/layout.tsx` envuelve la app en `<ClerkProvider>` dentro de `<body>`.
- `app/(auth)/sign-in/[[...sign-in]]/page.tsx` y `app/(auth)/sign-up/[[...sign-up]]/page.tsx` rendean forms propios basados en `useSignIn` / `useSignUp` (Future API), consistentes con el design system del panel.
- El form de sign-up es de dos pasos en una sola card: (1) email + password + datos de tienda; (2) verificación por código de email. Los datos de tienda viajan en `unsafeMetadata` y se persisten en el `Seller` la primera vez que el usuario toca una ruta protegida.
- `components/layout/seller-chrome.tsx` muestra el sidebar y `<UserButton />` cuando hay sesión.
- `lib/auth/current-seller.ts`:
  - `getCurrentSeller()` → `Seller | null`. Lee `auth().userId` de Clerk y busca `Seller` por `clerkUserId`. Si no existe, lo **autoprovisiona** llamando a `currentUser()` y haciendo `upsertSellerFromIdentity` (ver `sync-seller.ts`).
  - `requireSeller()` → `Seller`. Lanza si no hay sesión activa.
- `lib/auth/sync-seller.ts` expone `upsertSellerFromIdentity({ clerkUserId, email, phone })`.

## Estrategia: lazy registration (sin webhook)

No usamos webhooks de Clerk. El Clerk instance es compartido con otras apps; un webhook `user.created` registraría en esta DB a usuarios que jamás van a usar el panel de seller.

En su lugar, la creación del row `Seller` ocurre **on-demand** la primera vez que un usuario autenticado toca una ruta protegida de esta app: `getCurrentSeller()` detecta que no existe, lee la identidad con `currentUser()` y hace `upsert`. A partir de ese momento, el row existe y el flujo de `/onboarding` completa los datos faltantes antes de dejar entrar al panel.

## Datos de tienda en sign-up (`unsafeMetadata`)

Para evitar el doble paso (sign-up → /onboarding) en cuentas creadas desde esta app, el form de sign-up adjunta los campos de tienda al `unsafeMetadata` de Clerk vía `signUp.password({ ..., unsafeMetadata })`. Esos datos viajan con la cuenta hasta que la sesión queda activa.

`identityFromCurrentUser()` los lee con `parseShopFieldsFromMetadata()` (ver `lib/auth/shop-fields.ts`). Si pasan `validateShopFields()`, `upsertSellerFromIdentity()` los usa para inicializar el `Seller` en el `create`. El gate de `/onboarding` ve `isOnboarded() === true` y deja pasar al panel directo. Si el `unsafeMetadata` está vacío o inválido (ej. usuario que ya existía en Clerk por otra app), el row se crea con campos en blanco y el gate redirige a `/onboarding` como antes.

Consecuencias:
- Si el email/teléfono cambian en Clerk, el sync canónico es la próxima request del usuario al panel (el `upsert` actualiza esos campos en cada hit hasta que el row exista; después solo se vuelve a actualizar si pasa por el path de auto-provision).
- Una vez creado el `Seller`, los campos de tienda se editan desde el panel: ya no se vuelven a leer del `unsafeMetadata`.
- Borrados de cuenta en Clerk no se reflejan automáticamente — si hace falta limpieza, hay que hacerla aparte.

## Variables de entorno

Ver `.env.example`. Las requeridas son:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard`
