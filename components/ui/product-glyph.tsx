import type { ReactNode } from "react";
import type { GlyphKind, Palette } from "@/types/ui";

export type ProductGlyphProps = {
  kind: GlyphKind;
  palette?: Palette;
  size?: number;
};

const DEFAULT_PALETTE: Palette = ["#a4ac86", "#656d4a"];

export function ProductGlyph({
  kind,
  palette = DEFAULT_PALETTE,
  size = 80,
}: ProductGlyphProps) {
  const glyphs: Record<GlyphKind, ReactNode> = {
    bath: (
      <>
        <circle cx="40" cy="40" r="22" fill={palette[0]} />
        <path
          d="M28 42c4-2 20-2 24 0"
          stroke={palette[1]}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </>
    ),
    cocina: (
      <>
        <rect x="20" y="22" width="40" height="38" rx="4" fill={palette[0]} />
        <path
          d="M30 32h20M30 42h20M30 52h12"
          stroke={palette[1]}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ),
    comedor: (
      <>
        <circle cx="40" cy="34" r="14" fill={palette[0]} />
        <rect x="36" y="48" width="8" height="14" fill={palette[1]} />
      </>
    ),
    dormitorio: (
      <>
        <rect x="14" y="34" width="52" height="22" rx="3" fill={palette[0]} />
        <rect x="20" y="28" width="16" height="10" rx="2" fill={palette[1]} />
      </>
    ),
    decoracion: (
      <>
        <circle cx="40" cy="40" r="18" fill={palette[0]} />
        <path d="M32 40c4-8 12-8 16 0" stroke={palette[1]} strokeWidth="2" fill="none" />
      </>
    ),
    living: (
      <>
        <rect x="14" y="36" width="52" height="20" rx="6" fill={palette[0]} />
        <rect x="20" y="30" width="12" height="8" rx="2" fill={palette[1]} />
        <rect x="48" y="30" width="12" height="8" rx="2" fill={palette[1]} />
      </>
    ),
    terraza: (
      <>
        <path d="M40 18 22 50h36z" fill={palette[0]} />
        <rect x="36" y="50" width="8" height="14" fill={palette[1]} />
      </>
    ),
    box: (
      <>
        <path d="M20 28 40 18l20 10v22L40 60 20 50z" fill={palette[0]} />
        <path d="M20 28 40 38l20-10M40 38v22" stroke={palette[1]} strokeWidth="2" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size * 0.8}
      viewBox="0 0 80 64"
      className="block"
      aria-hidden="true"
    >
      {glyphs[kind]}
    </svg>
  );
}
