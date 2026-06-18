// Invoca un route handler de Next App Router con un Request mockeado.
// No levanta servidor: las funciones GET/POST/etc. exportadas por `route.ts`
// son funciones async normales que reciben un Request y devuelven un Response.
//
// El helper es genérico en `Params` para soportar handlers con params tipados
// específicos (ej. `{ product_id: string }`). En Next 16 los params son
// Promises, los wrappeamos con Promise.resolve.

type Headers = Record<string, string>;

type Handler<P extends Record<string, string>> = (
  request: Request,
  segment: { params: Promise<P> },
) => Promise<Response> | Response;

export async function invokeGet<P extends Record<string, string> = Record<string, string>>(
  handler: Handler<P>,
  opts: { url: string; headers?: Headers; params?: P },
): Promise<Response> {
  const req = new Request(opts.url, {
    method: 'GET',
    headers: opts.headers,
  });
  return handler(req, { params: Promise.resolve((opts.params ?? {}) as P) });
}

export async function invokePost<P extends Record<string, string> = Record<string, string>>(
  handler: Handler<P>,
  opts: { url: string; body?: unknown; headers?: Headers; params?: P },
): Promise<Response> {
  const headers: Headers = {
    'content-type': 'application/json',
    ...opts.headers,
  };
  const req = new Request(opts.url, {
    method: 'POST',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  return handler(req, { params: Promise.resolve((opts.params ?? {}) as P) });
}

export async function invokePatch<P extends Record<string, string> = Record<string, string>>(
  handler: Handler<P>,
  opts: { url: string; body?: unknown; headers?: Headers; params?: P },
): Promise<Response> {
  const headers: Headers = {
    'content-type': 'application/json',
    ...opts.headers,
  };
  const req = new Request(opts.url, {
    method: 'PATCH',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  return handler(req, { params: Promise.resolve((opts.params ?? {}) as P) });
}

export async function invokeDelete<P extends Record<string, string> = Record<string, string>>(
  handler: Handler<P>,
  opts: { url: string; headers?: Headers; params?: P },
): Promise<Response> {
  const req = new Request(opts.url, {
    method: 'DELETE',
    headers: opts.headers,
  });
  return handler(req, { params: Promise.resolve((opts.params ?? {}) as P) });
}
