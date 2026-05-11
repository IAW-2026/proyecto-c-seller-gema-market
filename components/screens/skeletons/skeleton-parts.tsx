import { Card } from "@/components/ui/card";
import {
  Skeleton,
  SkeletonCircle,
  SkeletonText,
} from "@/components/ui/skeleton";

export function PageHeaderSkeleton({
  withAction = false,
  withSubtitle = true,
}: {
  withAction?: boolean;
  withSubtitle?: boolean;
}) {
  return (
    <>
      {/* Mobile header bar */}
      <div className="block lgx:hidden">
        <div className="sticky top-0 z-30 bg-paper/95 backdrop-blur-[12px] px-4 border-b border-line flex items-center justify-between min-h-[52px]">
          <div className="w-12 shrink-0" />
          <div className="text-center flex-1 px-3 min-w-0 flex flex-col items-center gap-1">
            {withSubtitle && <SkeletonText width={60} height={8} />}
            <SkeletonText width={140} height={12} />
          </div>
          <div className="w-12 shrink-0" />
        </div>
      </div>

      {/* Desktop header */}
      <header className="hidden lgx:flex bg-paper border-b border-line px-7 py-5 justify-between items-end gap-4 flex-wrap">
        <div className="flex flex-col gap-2">
          {withSubtitle && <SkeletonText width={88} height={10} />}
          <SkeletonText width={260} height={26} />
        </div>
        {withAction && (
          <Skeleton className="h-[42px] w-[180px]" rounded="full" />
        )}
      </header>

      {/* Mobile sticky action slot */}
      {withAction && (
        <div className="block lgx:hidden fixed bottom-16 left-0 right-0 z-[39] bg-paper/95 backdrop-blur-[12px] border-t border-line px-4 py-2.5">
          <Skeleton className="h-[42px] w-full" rounded="full" />
        </div>
      )}
    </>
  );
}

export function ToolbarSkeleton({
  tabsCount = 0,
  withSearch = true,
  withSecondary = false,
}: {
  tabsCount?: number;
  withSearch?: boolean;
  withSecondary?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 lgx:flex-row lgx:items-center lgx:justify-between">
      {tabsCount > 0 && (
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1">
          {Array.from({ length: tabsCount }).map((_, i) => (
            <Skeleton
              key={i}
              rounded="full"
              className="h-9 w-24 shrink-0"
            />
          ))}
        </div>
      )}
      <div className="flex gap-2 lgx:ml-auto">
        {withSearch && (
          <Skeleton className="h-[42px] w-full lgx:w-[280px]" rounded="r2" />
        )}
        {withSecondary && (
          <Skeleton className="h-[42px] w-[140px] shrink-0" rounded="r2" />
        )}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <Card padding={20}>
      <SkeletonText width={110} height={11} className="mb-3" />
      <SkeletonText width={140} height={26} />
    </Card>
  );
}

export function PagerSkeleton() {
  return (
    <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-line">
      <SkeletonText width={120} height={11} />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8" rounded="full" />
        <Skeleton className="h-8 w-8" rounded="full" />
      </div>
    </div>
  );
}

export function TableSkeleton({
  columns,
  rows = 6,
  minWidth = 600,
}: {
  columns: ReadonlyArray<{ width: string; align?: "left" | "right" | "center" }>;
  rows?: number;
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto hidden lgx:block">
      <table
        className="w-full border-collapse text-[13px]"
        style={{ minWidth }}
      >
        <thead className="bg-cream">
          <tr>
            {columns.map((c, i) => (
              <th
                key={i}
                className="py-2.5 px-3 first:px-5 last:px-5"
                style={{ width: c.width }}
              >
                <SkeletonText width={64} height={9} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-line">
              {columns.map((c, i) => (
                <td
                  key={i}
                  className="py-3 px-3 first:px-5 last:px-5"
                  style={{ width: c.width }}
                >
                  <div
                    className={`flex ${c.align === "right" ? "justify-end" : c.align === "center" ? "justify-center" : "justify-start"}`}
                  >
                    <SkeletonText
                      width={c.align === "right" ? 70 : "70%"}
                      height={12}
                    />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MobileCardListSkeleton({
  count = 5,
  withMetaGrid = true,
  metaCells = 3,
}: {
  count?: number;
  withMetaGrid?: boolean;
  metaCells?: number;
}) {
  return (
    <div className="grid gap-3 p-3 lgx:hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-paper border border-line rounded-2xl p-3.5"
        >
          <div className="flex justify-between gap-2.5 items-start mb-3">
            <div className="flex gap-3 min-w-0 flex-1">
              <Skeleton className="w-[44px] h-[44px] shrink-0" rounded="r1" />
              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                <SkeletonText width="60%" height={11} />
                <SkeletonText width="80%" height={14} />
              </div>
            </div>
            <Skeleton className="h-6 w-16 shrink-0" rounded="full" />
          </div>
          {withMetaGrid && (
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${metaCells}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: metaCells }).map((__, j) => (
                <div key={j} className="bg-cream rounded-xl p-2.5">
                  <SkeletonText width={48} height={9} className="mb-1.5" />
                  <SkeletonText width={64} height={13} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function FieldSkeleton({ height = 46 }: { height?: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <SkeletonText width={88} height={10} />
      <Skeleton style={{ height }} rounded="r2" />
    </div>
  );
}

export function SectionTitleSkeleton({ width = 160 }: { width?: number }) {
  return <SkeletonText width={width} height={15} className="mb-4" />;
}

export function AvatarRowSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <SkeletonCircle size={28} />
      <SkeletonText width={96} height={12} />
    </div>
  );
}
