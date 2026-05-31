import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  // Callback del flujo OAuth (Google): debe ser accesible sin sesión activa
  // mientras Clerk finaliza el sign-in/sign-up.
  '/sso-callback(.*)',
  // Mocks de servicios externos (Shipping, Payments, etc.) que la Seller App
  // consume server-to-server. La Shipping App real vivirá en otro dominio
  // sin Clerk; durante el desarrollo individual los mockeamos acá.
  '/api/shipping(.*)',
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
