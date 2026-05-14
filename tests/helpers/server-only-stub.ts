// No-op para el paquete `server-only`. Vitest aliasea `server-only` a este
// archivo (ver vitest.config.ts) porque en runtime de Next el bundler lo
// redirige a un módulo vacío del lado server; sin Next, el paquete real
// lanza al cargarse.
export {};
