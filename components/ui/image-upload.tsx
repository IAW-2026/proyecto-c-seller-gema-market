"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";

// Validación cliente — mismas reglas que `lib/storage/images.ts`. El server
// es la fuente de verdad; acá replicamos para feedback inmediato y para
// evitar mandar archivos enormes a la red. Si difiere, gana el server.
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

type UploadAction = (formData: FormData) => Promise<string>;

function validateClient(file: File): string | null {
  if (!ACCEPT.split(",").includes(file.type)) {
    return "Formato no soportado. Usá JPG, PNG, WebP o AVIF.";
  }
  if (file.size > MAX_BYTES) {
    return `La imagen pesa ${(file.size / (1024 * 1024)).toFixed(1)} MB. Máximo 5 MB.`;
  }
  return null;
}

async function uploadFile(file: File, action: UploadAction): Promise<string> {
  const fd = new FormData();
  fd.set("file", file);
  return action(fd);
}

// ───── Single ───────────────────────────────────────────────────────────

export type SingleImageUploadProps = {
  value: string | null;
  onChange: (url: string | null) => void;
  onUpload: UploadAction;
  shape?: "cover" | "square" | "circle";
  alt: string;
  // Lo que se muestra cuando no hay imagen (placeholder visual).
  fallback?: ReactNode;
  // Etiqueta del botón. Si no se pasa, el botón es solo un ícono cámara.
  label?: string;
  // Cuando true, muestra debajo un botón "Quitar imagen" que setea value a null.
  // Útil para thumbnails opcionales; no tiene sentido para cover (siempre hay
  // gradiente de fallback) o logo embebido en avatar.
  removable?: boolean;
  // Solo para shape="circle". Tamaño en px del círculo (default 112).
  size?: number;
  // Solo para shape="circle". Classes extras del círculo (p.ej. para
  // simular un avatar con ring/shadow superpuesto a una portada).
  circleClassName?: string;
};

export function SingleImageUpload({
  value,
  onChange,
  onUpload,
  shape = "square",
  alt,
  fallback,
  label,
  removable = false,
  size = 112,
  circleClassName = "",
}: SingleImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const clientError = validateClient(file);
    if (clientError) {
      setError(clientError);
      return;
    }
    setIsUploading(true);
    try {
      const url = await uploadFile(file, onUpload);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const fileInput = (
    <input
      type="file"
      accept={ACCEPT}
      hidden
      disabled={isUploading}
      onChange={(e) => {
        void handleChange(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );

  if (shape === "cover") {
    return (
      <div className="relative w-full h-full">
        {value ? (
          <Image
            src={value}
            alt={alt}
            fill
            sizes="(max-width: 900px) 100vw, 900px"
            className="object-cover"
          />
        ) : (
          fallback
        )}
        <label
          className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-paper/95 text-xs font-medium inline-flex items-center gap-1.5 ${isUploading ? "opacity-60 cursor-progress" : "cursor-pointer"}`}
        >
          {fileInput}
          <Icon name="camera" size={14} />
          {isUploading ? "Subiendo…" : (label ?? "Cambiar")}
        </label>
        {error && (
          <div className="absolute bottom-3 left-3 right-3 px-3 py-1.5 rounded-r2 bg-danger/90 text-paper text-[12px]">
            {error}
          </div>
        )}
      </div>
    );
  }

  if (shape === "circle") {
    // Avatar: círculo solo (no se cubre con franjas) + botón "Cambiar" debajo.
    return (
      <div className="flex flex-col items-center gap-2">
        <div
          className={`rounded-full overflow-hidden bg-cream flex items-center justify-center text-ink-3 shrink-0 ${circleClassName || "border border-line-2"}`}
          style={{ width: size, height: size }}
        >
          {value ? (
            <div className="relative w-full h-full">
              <Image
                src={value}
                alt={alt}
                fill
                sizes={`${size}px`}
                className="object-cover"
              />
            </div>
          ) : (
            fallback ?? <Icon name="upload" size={Math.round(size * 0.32)} />
          )}
        </div>
        <label
          className={`px-3 py-1.5 rounded-full bg-bone text-[12px] font-medium inline-flex items-center gap-1.5 ${isUploading ? "opacity-60 cursor-progress" : "cursor-pointer hover:bg-[#e8e2d9]"}`}
        >
          {fileInput}
          <Icon name="camera" size={12} />
          {isUploading ? "Subiendo…" : (label ?? (value ? "Cambiar" : "Subir"))}
        </label>
        {value && removable && (
          <button
            type="button"
            className="text-[12px] text-ink-3 hover:text-danger"
            onClick={() => onChange(null)}
            disabled={isUploading}
          >
            Quitar imagen
          </button>
        )}
        {error && <div className="text-[12px] text-danger">{error}</div>}
      </div>
    );
  }

  // shape === "square"
  return (
    <div className="flex flex-col gap-2">
      <label
        className={`relative aspect-square rounded-r2 overflow-hidden border border-line-2 bg-cream flex items-center justify-center ${isUploading ? "opacity-60 cursor-progress" : "cursor-pointer"}`}
      >
        {fileInput}
        {value ? (
          <Image
            src={value}
            alt={alt}
            fill
            sizes="240px"
            className="object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-ink-3">
            {fallback ?? <Icon name="upload" size={24} />}
            <span className="text-[11px] mt-1.5">
              {isUploading ? "Subiendo…" : (label ?? "Subir")}
            </span>
          </div>
        )}
        {value && (
          <div className="absolute inset-x-0 bottom-0 bg-paper/95 text-[11px] text-center py-1.5 inline-flex items-center justify-center gap-1.5">
            <Icon name="camera" size={12} />
            {isUploading ? "Subiendo…" : (label ?? "Cambiar")}
          </div>
        )}
      </label>
      {value && removable && (
        <button
          type="button"
          className="text-[12px] text-ink-3 hover:text-danger self-start"
          onClick={() => onChange(null)}
          disabled={isUploading}
        >
          Quitar imagen
        </button>
      )}
      {error && (
        <div className="text-[12px] text-danger">{error}</div>
      )}
    </div>
  );
}

// ───── Multi ────────────────────────────────────────────────────────────

export type MultiImageUploadProps = {
  values: ReadonlyArray<string>;
  onChange: (urls: ReadonlyArray<string>) => void;
  onUpload: UploadAction;
  // Tiles a mostrar cuando todavía no hay imágenes (decorativo).
  emptyPlaceholders?: ReadonlyArray<ReactNode>;
};

export function MultiImageUpload({
  values,
  onChange,
  onUpload,
  emptyPlaceholders,
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const arr = Array.from(files);
    for (const f of arr) {
      const clientError = validateClient(f);
      if (clientError) {
        setError(clientError);
        return;
      }
    }
    setIsUploading(true);
    try {
      const uploaded = await Promise.all(
        arr.map((file) => uploadFile(file, onUpload)),
      );
      onChange([...values, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5">
        <label
          className={`aspect-square border-2 border-dashed border-line-2 rounded-r2 flex flex-col items-center justify-center text-ink-3 bg-cream ${isUploading ? "opacity-60 cursor-progress" : "cursor-pointer"}`}
        >
          <input
            type="file"
            accept={ACCEPT}
            multiple
            hidden
            disabled={isUploading}
            onChange={(e) => {
              void handleChange(e.target.files);
              e.target.value = "";
            }}
          />
          <Icon name="upload" size={20} />
          <span className="text-[11px] mt-1.5">
            {isUploading ? "Subiendo…" : "Subir"}
          </span>
        </label>
        {values.length === 0 && emptyPlaceholders
          ? emptyPlaceholders.map((node, i) => (
              <div
                key={`placeholder-${i}`}
                className="aspect-square rounded-r2 flex items-center justify-center"
              >
                {node}
              </div>
            ))
          : values.map((url, i) => (
              <div
                key={`${url}-${i}`}
                className="aspect-square rounded-r2 relative overflow-hidden bg-cream"
              >
                <Image
                  fill
                  src={url}
                  alt={`Imagen ${i + 1}`}
                  sizes="200px"
                  className="object-cover"
                />
                <button
                  type="button"
                  aria-label="Quitar imagen"
                  onClick={() => handleRemove(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-paper/90 flex items-center justify-center"
                >
                  <Icon name="close" size={12} />
                </button>
              </div>
            ))}
      </div>
      {error && <div className="mt-2 text-[12px] text-danger">{error}</div>}
    </div>
  );
}
