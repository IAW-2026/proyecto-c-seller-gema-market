import { Card } from "@/components/ui/card";
import { SkeletonRegion } from "@/components/ui/skeleton";
import {
  MobileCardListSkeleton,
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
      <ToolbarSkeleton tabsCount={2} withSearch={false} />
      <div className="mt-4">
        <Card padding={0}>
          <TableSkeleton columns={PRODUCTS_COLS} rows={6} minWidth={640} />
          <MobileCardListSkeleton count={5} metaCells={3} />
          <PagerSkeleton />
        </Card>
      </div>
    </SkeletonRegion>
  );
}
