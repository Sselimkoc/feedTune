import { Card, CardContent } from "@/components/core/ui/card";
import { Rss, Activity, Star, Bookmark } from "lucide-react";

export function DashboardStats({ stats, feeds = [] }) {
  // Calculate feeds by type
  const feedsByType = {
    rss: feeds.filter((f) => f.type === "rss").length,
    youtube: feeds.filter((f) => f.type === "youtube").length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Feeds"
        value={stats.totalFeeds}
        icon={<Rss className="h-6 w-6" />}
        color="blue"
        subtitle={`${feedsByType.rss} RSS • ${feedsByType.youtube} YouTube`}
      />
      <StatCard
        title="Total Items"
        value={stats.totalItems}
        icon={<Activity className="h-6 w-6" />}
        color="green"
        subtitle="All content"
      />
      <StatCard
        title="Favorites"
        value={stats.totalFavorites}
        icon={<Star className="h-6 w-6" />}
        color="blue"
        subtitle="Saved items"
      />
      <StatCard
        title="Read Later"
        value={stats.totalReadLater}
        icon={<Bookmark className="h-6 w-6" />}
        color="green"
        subtitle="To read"
      />
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value = 0, icon, color, subtitle }) {
  const colorClasses = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800",
    green:
      "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800",
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {(value || 0).toLocaleString()}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]} border`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
