import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Pager } from "@/components/ui/pager";
import { Pill } from "@/components/ui/pill";
import { AdminSearchBar } from "@/components/screens/admin/admin-search-bar";
import { AdminSalesStatusFilter } from "@/components/screens/admin/admin-sales-status-filter";
import { listAllSales } from "@/lib/data/admin/sales";
import type { SaleStatus } from "@/lib/generated/prisma/client";
import { ORDER_STATUS_META } from "@/lib/ui/ui-config";
import { fmtARS, fmtOrderDate } from "@/lib/ui/format";

export const metadata: Metadata = { title: "Admin · Ventas" };

type SearchParams = Promise<{
  q?: string;
  status?: string;
  page?: string;
  pageSize?: string;
}>;

const VALID_STATUSES: ReadonlyArray<SaleStatus> = [
  "paid",
  "shipping",
  "delivered",
  "shipping_failed",
];

function parseStatus(value: string | undefined): SaleStatus | undefined {
  return VALID_STATUSES.includes(value as SaleStatus)
    ? (value as SaleStatus)
    : undefined;
}

export default function AdminVentasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <>
      <PageHeader subtitle="Administración" title="Ventas del marketplace" />
      <div className="p-4 pb-20 lgx:px-7 lgx:py-6">
        <Suspense fallback={<div className="mb-4 h-[46px]" />}>
          <FiltersLoader searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={<Card>Cargando…</Card>}>
          <SalesTable searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function FiltersLoader({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <>
      <AdminSearchBar
        initialQuery={params.q ?? ""}
        placeholder="Buscar por producto, tienda o comprador…"
        ariaLabel="Buscar ventas"
      />
      <AdminSalesStatusFilter active={parseStatus(params.status) ?? "todos"} />
    </>
  );
}

async function SalesTable({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10) || 1;
  const pageSizeNum = Number.parseInt(params.pageSize ?? "", 10);
  const pageSize = Number.isFinite(pageSizeNum) ? pageSizeNum : undefined;

  const result = await listAllSales({
    query: params.q,
    status: parseStatus(params.status),
    page,
    pageSize,
  });

  return (
    <Card padding={0}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px] min-w-[760px]">
          <thead className="bg-cream">
            <tr className="text-left text-ink-3 font-mono text-[11px] uppercase tracking-[0.06em]">
              <th className="py-2.5 px-5">Producto</th>
              <th className="py-2.5 px-3">Tienda</th>
              <th className="py-2.5 px-3">Comprador</th>
              <th className="py-2.5 px-3 w-28">Fecha</th>
              <th className="py-2.5 px-3 w-28">Estado</th>
              <th className="py-2.5 px-5 w-28 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((s) => {
              const st = ORDER_STATUS_META[s.status];
              return (
                <tr key={s.id} className="border-b border-line">
                  <td className="py-3.5 px-5 font-medium truncate">
                    {s.productTitle}
                  </td>
                  <td className="py-3.5 px-3 text-ink-2 truncate">
                    {s.sellerShopName}
                  </td>
                  <td className="py-3.5 px-3 text-ink-2 truncate">
                    {s.buyerName}
                  </td>
                  <td className="py-3.5 px-3 text-ink-3">
                    {fmtOrderDate(s.createdAt)}
                  </td>
                  <td className="py-3.5 px-3">
                    <Pill tone={st.tone} size="sm">
                      {st.label}
                    </Pill>
                  </td>
                  <td className="py-3.5 px-5 text-right font-semibold tabular-nums">
                    {fmtARS(s.total)}
                  </td>
                </tr>
              );
            })}
            {result.items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 px-5 text-center text-ink-3">
                  No se encontraron ventas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pager
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/admin/ventas"
      />
    </Card>
  );
}
