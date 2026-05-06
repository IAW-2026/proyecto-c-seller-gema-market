import { monotonicFactory } from 'ulid';

const ulid = monotonicFactory();

export const PREFIXES = {
  seller:    'usr',
  product:   'prd',
  categoria: 'cat',
  sale:      'vnt',
  reserva:   'rsv',
} as const;

export type ModelKey = keyof typeof PREFIXES;
export type Prefix   = typeof PREFIXES[ModelKey];

export function newId(prefix: Prefix): string {
  return `${prefix}_${ulid()}`;
}
