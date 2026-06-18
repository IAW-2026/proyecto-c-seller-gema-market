import { Card } from "@/components/ui/card";
import {
  Skeleton,
  SkeletonCircle,
  SkeletonRegion,
  SkeletonText,
} from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "./skeleton-parts";

function StatusTimelineSkeleton() {
  return (
    <Card padding={20}>
      <div className="flex justify-between items-center mb-4">
        <SkeletonText width={150} height={15} />
        <Skeleton className="h-6 w-24" rounded="full" />
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-1">
            <Skeleton className="h-1 mb-2" rounded="full" />
            <SkeletonText width={70} height={11} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProductsCardSkeleton() {
  return (
    <Card padding={0}>
      <div className="p-5 border-b border-line">
        <SkeletonText width={120} height={15} />
      </div>
      <div className="p-4 flex gap-3 items-center border-b border-line max-[900px]:flex-wrap max-[900px]:items-start">
        <Skeleton className="w-14 h-14 shrink-0" rounded="r2" />
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <SkeletonText width="60%" height={14} />
          <SkeletonText width="40%" height={11} />
        </div>
        <SkeletonText
          width={100}
          height={14}
          className="max-[900px]:w-full"
        />
      </div>
      <div className="p-5 flex justify-between items-center">
        <SkeletonText width={64} height={15} />
        <SkeletonText width={120} height={15} />
      </div>
    </Card>
  );
}

function BuyerPanelSkeleton() {
  return (
    <Card padding={20}>
      <SkeletonText width={88} height={11} className="mb-3" />
      <div className="flex items-center gap-3">
        <SkeletonCircle size={44} />
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <SkeletonText width="70%" height={14} />
          <SkeletonText width="50%" height={11} />
        </div>
      </div>
    </Card>
  );
}

function PaymentPanelSkeleton() {
  return (
    <Card padding={20}>
      <SkeletonText width={56} height={11} className="mb-3" />
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center gap-3">
          <SkeletonText width={56} height={12} />
          <SkeletonText width={88} height={12} />
        </div>
        <div className="flex justify-between items-center gap-3">
          <SkeletonText width={56} height={12} />
          <Skeleton className="h-[18px] w-20" rounded="full" />
        </div>
        <div className="flex justify-between items-center gap-3">
          <SkeletonText width={64} height={12} />
          <SkeletonText width={72} height={12} />
        </div>
      </div>
    </Card>
  );
}

export function OrderDetailSkeleton() {
  return (
    <SkeletonRegion label="Cargando detalle del pedido">
      <PageHeaderSkeleton withAction />
      <div className="p-4 pb-32 lgx:px-7 lgx:py-6">
        <div className="grid gap-4 grid-cols-1 min-[901px]:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <div className="flex flex-col gap-4">
            <StatusTimelineSkeleton />
            <ProductsCardSkeleton />
          </div>
          <div className="flex flex-col gap-4">
            <BuyerPanelSkeleton />
            <PaymentPanelSkeleton />
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}
