// Stub no-op de `next/cache` para Vitest. En Next 16 las funciones de cache
// (cacheTag, updateTag, etc.) requieren la config `cacheComponents` activa y
// un runtime de Next que provea el contexto de cache. Fuera de Next esas
// llamadas tiran. Acá las hacemos no-ops: en tests no hay cache real que
// taggear ni invalidar, así que el código de producción puede seguir
// llamándolas sin romper.
export function cacheTag(..._tags: string[]): void {}
export function updateTag(..._tags: string[]): void {}
export function revalidateTag(..._tags: string[]): void {}
export function revalidatePath(_path: string, _type?: 'layout' | 'page'): void {}
export function unstable_cache<T extends (...args: never[]) => unknown>(fn: T): T {
  return fn;
}
