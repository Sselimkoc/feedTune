import { Card, CardContent } from "@/components/core/ui/card";
import { Rss, Activity, Star, Bookmark } from "lucide-react";

export function DashboardStats({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Feeds"
        value={stats.totalFeeds}
        icon={<Rss className="h-6 w-6" />}
        color="blue"
        subtitle={`${stats.feedsByType?.rss || 0} RSS • ${stats.feedsByType?.youtube || 0} YouTube`}
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
        color="yellow"
        subtitle="Saved items"
      />
      <StatCard
        title="Read Later"
        value={stats.totalReadLater}
        icon={<Bookmark className="h-6 w-6" />}
        color="purple"
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
    yellow:
      "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800",
    purple:
      "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800",
    orange:
      "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800",
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
