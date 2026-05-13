// Invoca un route handler de Next App Router con un Request mockeado.
// No levanta servidor: las funciones GET/POST/etc. exportadas por `route.ts`
// son funciones async normales que reciben un Request y devuelven un Response.
//
// Uso:
//   const res = await invokeGet(GET, { url: 'http://test/api/seller/categorias' });
//   const res = await invokePost(POST, {
//     url: 'http://test/api/seller/productos/abc/reservar',
//     body: { order_id: 'ord-1', ... },
//     params: { product_id: 'abc' },
//   });

type Headers = Record<string, string>;
type Params = Record<string, string>;

type GetHandler = (
  request: Request,
  segment?: { params: Promise<Params> },
) => Promise<Response> | Response;

type PostHandler = GetHandler;

export async function invokeGet(
  handler: GetHandler,
  opts: { url: string; headers?: Headers; params?: Params },
): Promise<Response> {
  const req = new Request(opts.url, {
    method: 'GET',
    headers: opts.headers,
  });
  return handler(req, { params: Promise.resolve(opts.params ?? {}) });
}

export async function invokePost(
  handler: PostHandler,
  opts: { url: string; body?: unknown; headers?: Headers; params?: Params },
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
  return handler(req, { params: Promise.resolve(opts.params ?? {}) });
}
