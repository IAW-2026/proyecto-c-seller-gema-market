import { Card } from "@/components/ui/card";
import { SkeletonRegion } from "@/components/ui/skeleton";
import {
  MobileCardListSkeleton,
  PageHeaderSkeleton,
  PagerSkeleton,
  TableSkeleton,
  ToolbarSkeleton,
} from "./skeleton-parts";

const PRODUCTS_COLS = [
  { width: "44%" },
  { width: "16%" },
  { width: "14%" },
  { width: "14%" },
  { width: "12%", align: "right" as const },
];

export function ProductsSkeleton() {
  return (
    <SkeletonRegion label="Cargando publicaciones">
      <PageHeaderSkeleton withAction />
      <div className="p-4 pb-32 lgx:px-7 lgx:py-6">
        <ToolbarSkeleton tabsCount={2} withSearch withSecondary />
        <div className="mt-4">
          <Card padding={0}>
            <TableSkeleton columns={PRODUCTS_COLS} rows={6} minWidth={640} />
            <MobileCardListSkeleton count={5} metaCells={3} />
            <PagerSkeleton />
          </Card>
        </div>
      </div>
    </SkeletonRegion>
  );
}
