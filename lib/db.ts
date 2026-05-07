import 'server-only';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '@/lib/env';
import { newId, PREFIXES, type Prefix } from '@/lib/ids';

function buildClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  const base = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
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

type Client = ReturnType<typeof buildClient>;

const globalForPrisma = globalThis as unknown as { prisma: Client | undefined };

// Lazy: el cliente se construye en el primer acceso real, no al importar.
// Esto evita evaluar env.DATABASE_URL durante "Collecting page data" del build.
let cachedClient: Client | undefined;

function getClient(): Client {
  if (cachedClient) return cachedClient;
  cachedClient = globalForPrisma.prisma ?? buildClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = cachedClient;
  }
  return cachedClient;
}

export const prisma = new Proxy({} as Client, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
}) as Client;
