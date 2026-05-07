import { Card } from "@/components/ui/card";
import {
  Skeleton,
  SkeletonCircle,
  SkeletonRegion,
  SkeletonText,
} from "@/components/ui/skeleton";
import { FieldSkeleton, PageHeaderSkeleton, SectionTitleSkeleton } from "./skeleton-parts";

export function ShopSkeleton() {
  return (
    <SkeletonRegion label="Cargando perfil de tienda">
      <PageHeaderSkeleton withAction />
      <div className="p-4 pb-32 lgx:px-7 lgx:py-6">
        <Card padding={0} className="mb-4 overflow-hidden">
          <Skeleton
            className="h-40 max-[560px]:h-[132px] w-full"
            rounded="none"
          />
          <div className="px-6 pb-6">
            <div className="flex items-center gap-4 mb-5 max-[560px]:items-start max-[560px]:gap-3">
              <div className="-mt-11 shrink-0 relative z-[1]">
                <SkeletonCircle size={88} className="border-4 border-paper" />
              </div>
              <div className="flex-1 pt-3 min-w-0 flex flex-col gap-2">
                <SkeletonText width={220} height={22} />
                <SkeletonText width={160} height={13} />
              </div>
            </div>
            <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(130px,1fr))]">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-3 bg-cream rounded-r2 flex flex-col gap-1.5">
                  <SkeletonText width={64} height={11} />
                  <SkeletonText width={48} height={20} />
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid gap-4 grid-cols-1 min-[901px]:grid-cols-2">
          <Card padding={24}>
            <SectionTitleSkeleton width={180} />
            <div className="flex flex-col gap-3.5">
              <FieldSkeleton />
              <FieldSkeleton height={88} />
            </div>
          </Card>
          <Card padding={24}>
            <SectionTitleSkeleton width={200} />
            <div className="flex flex-col gap-3.5">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
          </Card>
          <Card padding={24} className="col-span-full">
            <SectionTitleSkeleton width={200} />
            <div className="grid gap-3.5 grid-cols-1 min-[521px]:grid-cols-2 min-[901px]:grid-cols-[2fr_2fr_1fr_1fr_1fr]">
              {Array.from({ length: 5 }).map((_, i) => (
                <FieldSkeleton key={i} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </SkeletonRegion>
  );
}
