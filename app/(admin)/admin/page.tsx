import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { getAdminMetrics } from "@/lib/data/admin/metrics";
import { fmtARS } from "@/lib/ui/format";

export const metadata: Metadata = { title: "Admin · Dashboard" };

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader subtitle="Administración" title="Panel del marketplace" />
      <div className="p-4 pb-20 lgx:px-7 lgx:py-6">
        <Suspense fallback={<MetricsFallback />}>
          <Metrics />
        </Suspense>
      </div>
    </>
  );
}

function MetricsFallback() {
  return (
    <div className="grid grid-cols-2 lgx:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <div className="h-12 animate-pulse bg-bone rounded-xl" />
        </Card>
      ))}
    </div>
  );
}

async function Metrics() {
  const m = await getAdminMetrics();
  const cards: ReadonlyArray<{ label: string; value: string; hint?: string }> = [
    {
      label: "Tiendas",
      value: String(m.sellers.total),
      hint: `${m.sellers.suspended} suspendida(s)`,
    },
    {
      label: "Productos",
      value: String(m.products.total),
      hint: `${m.products.hidden} oculto(s)`,
    },
    { label: "Ventas", value: String(m.sales.count) },
    { label: "Ingresos", value: fmtARS(m.sales.revenue) },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lgx:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-ink-3 mb-1.5">
              {c.label}
            </div>
            <div className="text-[26px] font-semibold tracking-[-0.02em] tabular-nums">
              {c.value}
            </div>
            {c.hint && <div className="text-xs text-ink-3 mt-1">{c.hint}</div>}
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-ink-2 mb-3">
          Categorías con más productos
        </h2>
        <Card padding={0}>
          <ul className="divide-y divide-line">
            {m.topCategories.map((cat) => (
              <li
                key={cat.name}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <span className="font-medium">{cat.name}</span>
                <span className="font-mono text-ink-3 tabular-nums">
                  {cat.productsCount}
                </span>
              </li>
            ))}
            {m.topCategories.length === 0 && (
              <li className="px-5 py-10 text-center text-ink-3 text-sm">
                Todavía no hay categorías con productos.
              </li>
            )}
          </ul>
        </Card>
      </div>
    </>
  );
}
