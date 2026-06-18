// Helpers para responses JSON de los route handlers públicos. Centralizan el
// shape `{ error: "..." }` y los status codes para no repetir literales en
// cada handler.

export function jsonOk<T>(data: T): Response {
  return Response.json(data as unknown as Record<string, unknown>, { status: 200 });
}

export function jsonCreated<T>(data: T): Response {
  return Response.json(data as unknown as Record<string, unknown>, { status: 201 });
}

export function jsonBadRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

export function jsonUnauthorized(): Response {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export function jsonNotFound(message = 'Not Found'): Response {
  return Response.json({ error: message }, { status: 404 });
}

export function jsonConflict(message: string): Response {
  return Response.json({ error: message }, { status: 409 });
}

export function jsonServerError(message = 'Server Error'): Response {
  return Response.json({ error: message }, { status: 500 });
}
