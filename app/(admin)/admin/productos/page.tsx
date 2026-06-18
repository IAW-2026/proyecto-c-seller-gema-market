import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Pager } from "@/components/ui/pager";
import { Pill } from "@/components/ui/pill";
import { AdminSearchBar } from "@/components/screens/admin/admin-search-bar";
import { AdminVisibilityFilter } from "@/components/screens/admin/admin-visibility-filter";
import { ProductHideButton } from "@/components/screens/admin/product-hide-button";
import { AdminProductsSkeleton } from "@/components/screens/skeletons/admin-products-skeleton";
import { listAllProducts, type AdminVisibility } from "@/lib/data/admin/products";
import { fmtARS } from "@/lib/ui/format";

export const metadata: Metadata = { title: "Admin · Productos" };

type SearchParams = Promise<{
  q?: string;
  visibility?: string;
  page?: string;
  pageSize?: string;
}>;

function parseVisibility(value: string | undefined): AdminVisibility {
  return value === "visible" || value === "hidden" ? value : "all";
}

export default function AdminProductosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <>
      <PageHeader subtitle="Administración" title="Productos" />
      <div className="p-4 pb-20 lgx:px-7 lgx:py-6">
        <Suspense fallback={<div className="mb-4 h-[46px]" />}>
          <FiltersLoader searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={<AdminProductsSkeleton />}>
          <ProductsTable searchParams={searchParams} />
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
        placeholder="Buscar por producto o tienda…"
        ariaLabel="Buscar productos por título o tienda"
      />
      <AdminVisibilityFilter active={parseVisibility(params.visibility)} />
    </>
  );
}

async function ProductsTable({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10) || 1;
  const pageSizeNum = Number.parseInt(params.pageSize ?? "", 10);
  const pageSize = Number.isFinite(pageSizeNum) ? pageSizeNum : undefined;

  const result = await listAllProducts({
    query: params.q,
    visibility: parseVisibility(params.visibility),
    page,
    pageSize,
  });

  return (
    <Card padding={0}>
      <div className="overflow-x-auto hidden lgx:block">
        <table className="w-full border-collapse text-[13px] min-w-[680px]">
          <thead className="bg-cream">
            <tr className="text-left text-ink-3 font-mono text-[11px] uppercase tracking-[0.06em]">
              <th className="py-2.5 px-5">Producto</th>
              <th className="py-2.5 px-3">Tienda</th>
              <th className="py-2.5 px-3 w-28 text-right">Precio</th>
              <th className="py-2.5 px-3 w-28">Estado</th>
              <th className="py-2.5 px-5 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((p) => (
              <tr key={p.id} className="border-b border-line">
                <td className="py-3.5 px-5">
                  <div className="font-medium truncate">{p.title}</div>
                  <div className="text-[11px] text-ink-3">{p.categoryName}</div>
                </td>
                <td className="py-3.5 px-3 text-ink-2 truncate">
                  {p.sellerShopName}
                </td>
                <td className="py-3.5 px-3 text-right font-semibold tabular-nums">
                  {fmtARS(p.price)}
                </td>
                <td className="py-3.5 px-3">
                  {p.hiddenByAdmin ? (
                    <Pill tone="danger" size="sm">
                      Oculto
                    </Pill>
                  ) : (
                    <Pill
                      tone={p.status === "active" ? "success" : "warn"}
                      size="sm"
                    >
                      {p.status === "active" ? "Visible" : "Pausado"}
                    </Pill>
                  )}
                </td>
                <td className="py-3.5 px-5">
                  <ProductHideButton productId={p.id} hidden={p.hiddenByAdmin} />
                </td>
              </tr>
            ))}
            {result.items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 px-5 text-center text-ink-3">
                  No se encontraron productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 lgx:hidden">
        {result.items.map((p) => (
          <div
            key={p.id}
            className="bg-paper border border-line rounded-2xl p-3"
          >
            <div className="flex justify-between gap-2.5 items-start mb-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{p.title}</div>
                <div className="text-[11px] text-ink-3 mt-[3px]">
                  {p.categoryName}
                </div>
              </div>
              {p.hiddenByAdmin ? (
                <Pill tone="danger" size="sm">
                  Oculto
                </Pill>
              ) : (
                <Pill
                  tone={p.status === "active" ? "success" : "warn"}
                  size="sm"
                >
                  {p.status === "active" ? "Visible" : "Pausado"}
                </Pill>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-cream rounded-xl p-2.5 min-w-0">
                <div className="text-[10px] text-ink-3">Tienda</div>
                <div className="text-xs font-semibold truncate">
                  {p.sellerShopName}
                </div>
              </div>
              <div className="bg-cream rounded-xl p-2.5">
                <div className="text-[10px] text-ink-3">Precio</div>
                <div className="text-xs font-bold tabular-nums">
                  {fmtARS(p.price)}
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <ProductHideButton productId={p.id} hidden={p.hiddenByAdmin} />
            </div>
          </div>
        ))}
        {result.items.length === 0 && (
          <div className="text-center text-ink-3 py-10 text-sm">
            No se encontraron productos.
          </div>
        )}
      </div>
      <Pager
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/admin/productos"
      />
    </Card>
  );
}
