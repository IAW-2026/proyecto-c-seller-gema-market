import 'server-only';
import { monotonicFactory } from 'ulid';
import { getSupabaseStorage, STORAGE_BUCKET } from './supabase';

const ulid = monotonicFactory();

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

type AllowedMime = (typeof ALLOWED_IMAGE_MIME)[number];

function isAllowedMime(mime: string): mime is AllowedMime {
  return (ALLOWED_IMAGE_MIME as ReadonlyArray<string>).includes(mime);
}

export function validateImage(file: File): void {
  if (!isAllowedMime(file.type)) {
    throw new Error(
      `Formato no soportado. Usá JPG, PNG, WebP o AVIF (recibido: ${file.type || 'desconocido'}).`,
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`La imagen pesa ${mb} MB. El máximo permitido es 5 MB.`);
  }
}

function extFromMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg': return 'jpg';
    case 'image/png':  return 'png';
    case 'image/webp': return 'webp';
    case 'image/avif': return 'avif';
    default:           return 'bin';
  }
}

// Sube un archivo al bucket y devuelve la URL pública permanente.
// `prefix` es la "carpeta" lógica (p.ej. `sellers/<id>`, `products/<id>`).
// Cada subida genera un nombre único con ULID — no se sobrescriben archivos
// y un upload nunca depende del `name` que mande el browser.
export async function uploadImage(file: File, prefix: string): Promise<string> {
  validateImage(file);
  const supabase = getSupabaseStorage();
  const path = `${prefix}/${ulid()}.${extFromMime(file.type)}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });
  if (error) {
    throw new Error(`No pudimos subir la imagen: ${error.message}`);
  }
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Cleanup best-effort: si falla no rompe el flujo principal (el upload nuevo
// ya está hecho, lo peor es un archivo huérfano).
export async function deleteImageByUrl(
  url: string | null | undefined,
): Promise<void> {
  if (!url) return;
  const path = parseStoragePath(url);
  if (!path) return;
  try {
    const supabase = getSupabaseStorage();
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  } catch (err) {
    console.warn('deleteImageByUrl: no se pudo borrar', url, err);
  }
}

// Extrae el path interno del bucket a partir de un public URL.
// Ejemplo:
//   https://xxx.supabase.co/storage/v1/object/public/gema-market/products/usr_123/abc.jpg
// → "products/usr_123/abc.jpg"
function parseStoragePath(url: string): string | null {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const path = url.slice(idx + marker.length);
  return path || null;
}

// Diff helper: dado el array viejo y el nuevo, devuelve URLs que ya no están.
export function removedUrls(
  oldUrls: ReadonlyArray<string>,
  newUrls: ReadonlyArray<string>,
): string[] {
  const newSet = new Set(newUrls);
  return oldUrls.filter((u) => !newSet.has(u));
}
