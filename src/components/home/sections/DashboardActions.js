import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/core/ui/card";
import { Button } from "@/components/core/ui/button";
import { Plus, RefreshCw, Star, Bookmark, TrendingUp } from "lucide-react";

export function DashboardActions({
  onAddFeed,
  onRefresh,
  onFavorites,
  onReadLater,
}) {
  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={onAddFeed}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Feed
          </Button>
          <Button
            variant="outline"
            onClick={onRefresh}
            className="border-gray-200 dark:border-gray-600"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All
          </Button>
          <Button
            variant="outline"
            onClick={onFavorites}
            className="border-gray-200 dark:border-gray-600"
          >
            <Star className="h-4 w-4 mr-2" />
            View Favorites
          </Button>
          <Button
            variant="outline"
            onClick={onReadLater}
            className="border-gray-200 dark:border-gray-600"
          >
            <Bookmark className="h-4 w-4 mr-2" />
            Read Later
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
