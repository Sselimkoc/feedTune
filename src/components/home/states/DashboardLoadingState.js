import { Skeleton } from "@/components/core/ui/skeleton";

function CardSkeleton({ rows = 5 }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-6 w-14 rounded" />
      </div>
      {/* Card rows */}
      <div className="p-2 flex flex-col gap-px">
        {[...Array(rows)].map((_, j) => (
          <div key={j} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-full rounded" />
              <Skeleton className="h-2.5 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardLoadingState() {
  return (
    <div className="relative mx-auto w-full px-4 pt-4 pb-8 max-w-6xl flex flex-col gap-4">

      {/* ── Welcome skeleton ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 border-b border-border">
        {/* Left: title block */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-2.5 w-24 rounded" />
          <Skeleton className="h-7 w-48 rounded" />
          <Skeleton className="h-3 w-36 rounded" />
        </div>
        {/* Right: action buttons — stacked on mobile, row on sm+ */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:flex-shrink-0">
          <Skeleton className="h-10 w-full sm:w-24 rounded-md" />
          <Skeleton className="h-10 w-full sm:w-28 rounded-md" />
        </div>
      </div>

      {/* ── Content grid: 1 col mobile → 2 col desktop ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mobilde sadece 1 kart, desktop'ta 2 kart */}
        <CardSkeleton rows={5} />
        <div className="hidden lg:block">
          <CardSkeleton rows={5} />
        </div>
      </div>

    </div>
  );
}
