import { Skeleton } from "@/components/core/ui/skeleton";

export function DashboardLoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          {/* Welcome Skeleton */}
          <Skeleton className="h-32 w-full rounded-2xl" />

          {/* Stats Skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>

          {/* Actions Skeleton */}
          <Skeleton className="h-20 w-full rounded-lg" />

          {/* Feeds and Activity Skeletons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
