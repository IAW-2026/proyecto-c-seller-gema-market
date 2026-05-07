import { Card } from "@/components/ui/card";
import { SkeletonRegion } from "@/components/ui/skeleton";
import {
  MobileCardListSkeleton,
  PageHeaderSkeleton,
  PagerSkeleton,
  TableSkeleton,
  ToolbarSkeleton,
} from "./skeleton-parts";

const ORDERS_COLS = [
  { width: "16%" },
  { width: "26%" },
  { width: "18%" },
  { width: "16%" },
  { width: "18%", align: "right" as const },
  { width: "6%" },
];

export function OrdersSkeleton() {
  return (
    <SkeletonRegion label="Cargando pedidos">
      <PageHeaderSkeleton />
      <div className="p-4 pb-16 lgx:px-7 lgx:py-6">
        <ToolbarSkeleton tabsCount={4} withSearch withSecondary />
        <div className="mt-4">
          <Card padding={0}>
            <TableSkeleton columns={ORDERS_COLS} rows={7} minWidth={760} />
            <MobileCardListSkeleton count={5} metaCells={2} />
            <PagerSkeleton />
          </Card>
        </div>
      </div>
    </SkeletonRegion>
  );
}
