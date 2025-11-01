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
        trend="+2 this week"
      />
      <StatCard
        title="Total Items"
        value={stats.totalItems}
        icon={<Activity className="h-6 w-6" />}
        color="green"
        trend="+15 today"
      />
      <StatCard
        title="Favorites"
        value={stats.totalFavorites}
        icon={<Star className="h-6 w-6" />}
        color="yellow"
        trend="+3 this week"
      />
      <StatCard
        title="Read Later"
        value={stats.totalReadLater}
        icon={<Bookmark className="h-6 w-6" />}
        color="purple"
        trend="+8 this week"
      />
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color, trend }) {
  const colorClasses = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
    green:
      "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
    yellow:
      "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
    purple:
      "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20",
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {value.toLocaleString()}
            </p>
            {trend && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
