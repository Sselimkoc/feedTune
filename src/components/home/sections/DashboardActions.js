import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/core/ui/card";
import { Button } from "@/components/core/ui/button";
import { Plus, RefreshCw, Star, Bookmark, Zap } from "lucide-react";

export function DashboardActions({
  onAddFeed,
  onRefresh,
  onFavorites,
  onReadLater,
}) {
  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div>Quick Actions</div>
            <div className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-1">
              Manage your feeds
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ActionButton
            onClick={onAddFeed}
            icon={<Plus className="h-4 w-4" />}
            label="Add Feed"
            variant="primary"
          />
          <ActionButton
            onClick={onRefresh}
            icon={<RefreshCw className="h-4 w-4" />}
            label="Sync All"
            variant="secondary"
          />
          <ActionButton
            onClick={onFavorites}
            icon={<Star className="h-4 w-4" />}
            label="Favorites"
            variant="secondary"
          />
          <ActionButton
            onClick={onReadLater}
            icon={<Bookmark className="h-4 w-4" />}
            label="Read Later"
            variant="secondary"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ActionButton({ onClick, icon, label, variant }) {
  return (
    <Button
      onClick={onClick}
      variant={variant === "primary" ? "default" : "outline"}
      className={`h-auto py-3 flex flex-col items-center justify-center gap-1.5 rounded-lg transition-all ${
        variant === "primary"
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
          : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
      }`}
    >
      <div className="text-lg">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </Button>
  );
}
