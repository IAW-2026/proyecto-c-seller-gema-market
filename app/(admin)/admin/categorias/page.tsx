import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { CategoriesManager } from "@/components/screens/admin/categories-manager";
import { listCategoriesWithCounts } from "@/lib/data/admin/categories";

export const metadata: Metadata = { title: "Admin · Categorías" };

export default function AdminCategoriasPage() {
  return (
    <>
      <PageHeader subtitle="Administración" title="Categorías" />
      <div className="p-4 pb-20 lgx:px-7 lgx:py-6 max-w-3xl">
        <Suspense fallback={<Card>Cargando…</Card>}>
          <CategoriesLoader />
        </Suspense>
      </div>
    </>
  );
}

async function CategoriesLoader() {
  const categories = await listCategoriesWithCounts();
  return <CategoriesManager categories={categories} />;
}
