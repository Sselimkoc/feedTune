import { Skeleton } from "@/components/core/ui/skeleton";

export function DashboardLoadingState() {
  return (
    <div className="relative flex flex-col h-[calc(100vh-11rem)]">
      <div className="relative z-10 flex flex-col flex-1 min-h-0 mx-auto w-full px-4 pt-4 max-w-6xl gap-4">
        {/* Welcome skeleton */}
        <div className="flex items-center justify-between gap-4 py-4 border-b border-border">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-8 w-56 rounded" />
            <Skeleton className="h-3 w-40 rounded" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        </div>

        {/* Feeds + Activity skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {[0, 1].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-6 w-16 rounded" />
              </div>
              <div className="p-2 flex flex-col gap-px">
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="flex items-center gap-3 px-3 py-2.5">
                    <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <Skeleton className="h-3.5 w-full rounded" />
                      <Skeleton className="h-2.5 w-24 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
