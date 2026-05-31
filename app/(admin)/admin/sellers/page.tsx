import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Pager } from "@/components/ui/pager";
import { Pill } from "@/components/ui/pill";
import { AdminSearchBar } from "@/components/screens/admin/admin-search-bar";
import { SellerSuspendButton } from "@/components/screens/admin/seller-suspend-button";
import { listAllSellers } from "@/lib/data/admin/sellers";

export const metadata: Metadata = { title: "Admin · Tiendas" };

type SearchParams = Promise<{ q?: string; page?: string; pageSize?: string }>;

export default function AdminSellersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <>
      <PageHeader subtitle="Administración" title="Tiendas" />
      <div className="p-4 pb-20 lgx:px-7 lgx:py-6">
        <Suspense fallback={<div className="mb-4 h-[46px]" />}>
          <SearchLoader searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={<Card>Cargando…</Card>}>
          <SellersTable searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function SearchLoader({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <AdminSearchBar
      initialQuery={params.q ?? ""}
      placeholder="Buscar por tienda o email…"
      ariaLabel="Buscar tiendas por nombre o email"
    />
  );
}

async function SellersTable({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10) || 1;
  const pageSizeNum = Number.parseInt(params.pageSize ?? "", 10);
  const pageSize = Number.isFinite(pageSizeNum) ? pageSizeNum : undefined;

  const result = await listAllSellers({ query: params.q, page, pageSize });

  return (
    <Card padding={0}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px] min-w-[640px]">
          <thead className="bg-cream">
            <tr className="text-left text-ink-3 font-mono text-[11px] uppercase tracking-[0.06em]">
              <th className="py-2.5 px-5">Tienda</th>
              <th className="py-2.5 px-3">Email</th>
              <th className="py-2.5 px-3 w-24 text-right">Productos</th>
              <th className="py-2.5 px-3 w-20 text-right">Ventas</th>
              <th className="py-2.5 px-3 w-28">Estado</th>
              <th className="py-2.5 px-5 w-36"></th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((s) => (
              <tr key={s.id} className="border-b border-line">
                <td className="py-3.5 px-5">
                  <div className="font-medium truncate">{s.shopName || "—"}</div>
                  <div className="text-[11px] text-ink-3">{s.city}</div>
                </td>
                <td className="py-3.5 px-3 text-ink-2 truncate">{s.email}</td>
                <td className="py-3.5 px-3 text-right tabular-nums">
                  {s.productsCount}
                </td>
                <td className="py-3.5 px-3 text-right tabular-nums">
                  {s.salesCount}
                </td>
                <td className="py-3.5 px-3">
                  <Pill tone={s.suspended ? "danger" : "success"} size="sm">
                    {s.suspended ? "Suspendida" : "Activa"}
                  </Pill>
                </td>
                <td className="py-3.5 px-5">
                  <SellerSuspendButton
                    sellerId={s.id}
                    shopName={s.shopName || s.email}
                    suspended={s.suspended}
                  />
                </td>
              </tr>
            ))}
            {result.items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 px-5 text-center text-ink-3">
                  No se encontraron tiendas.
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
        basePath="/admin/sellers"
      />
    </Card>
  );
}
