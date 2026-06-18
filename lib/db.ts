import 'server-only';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '@/lib/env';
import { newId, PREFIXES, type Prefix } from '@/lib/ids';

function buildClient() {
  // El driver adapter (`pg`) ignora el `?schema=` de la connection string —
  // solo el query engine nativo lo respeta. Hay que pasarlo explícitamente acá,
  // si no las queries corren contra `public`. En tests la URL trae `?schema=test`
  // (override en tests/global-setup.ts); en dev/prod no hay schema → default.
  const schema = new URL(env.DATABASE_URL).searchParams.get('schema') ?? undefined;
  const adapter = new PrismaPg(
    { connectionString: env.DATABASE_URL },
    schema ? { schema } : undefined,
  );
  const base = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  const fillId = (prefix: Prefix) => ({
    create({ args, query }: { args: { data: Record<string, unknown> }; query: (a: unknown) => Promise<unknown> }) {
      args.data.id ??= newId(prefix);
      return query(args);
    },
    upsert({ args, query }: { args: { create: Record<string, unknown> }; query: (a: unknown) => Promise<unknown> }) {
      args.create.id ??= newId(prefix);
      return query(args);
    },
    createMany({ args, query }: { args: { data: Record<string, unknown> | Record<string, unknown>[] }; query: (a: unknown) => Promise<unknown> }) {
      const rows = Array.isArray(args.data) ? args.data : [args.data];
      args.data = rows.map((row) => ({ ...row, id: row.id ?? newId(prefix) }));
      return query(args);
    },
  });

  return base.$extends({
    query: {
      seller:    fillId(PREFIXES.seller),
      categoria: fillId(PREFIXES.categoria),
      product:   fillId(PREFIXES.product),
      sale:      fillId(PREFIXES.sale),
      reserva:   fillId(PREFIXES.reserva),
    },
  });
}

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof buildClient> | undefined };

export const prisma = globalForPrisma.prisma ?? buildClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
