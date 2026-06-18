import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  // Callback del flujo OAuth (Google): debe ser accesible sin sesión activa
  // mientras Clerk finaliza el sign-in/sign-up.
  '/sso-callback(.*)',
  // API de integración con el marketplace (Buyer, Payments, Shipping). No usan
  // sesión Clerk: cada handler valida el header `X-API-Key-Hash` por su cuenta
  // (lib/api/auth.ts → requireApiKeyAuth). Sin esto Clerk las frenaría antes de
  // llegar al gate de la API key.
  '/api/seller(.*)',
  // Jobs internos disparados por Vercel Cron, autenticados con CRON_SECRET
  // (Authorization: Bearer) en el propio handler — no por sesión Clerk.
  '/api/internal(.*)',
]);

export default clerkMiddleware(
  async (auth, req) => {
    if (isPublicRoute(req)) return;
    await auth.protect();
  },
  () => ({
    signInUrl: "/sign-in",
  }),
);

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
