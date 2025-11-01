import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/core/ui/card";
import { Button } from "@/components/core/ui/button";
import { Badge } from "@/components/core/ui/badge";
import { Rss, Youtube, ArrowRight, Plus, Trash2 } from "lucide-react";

export function DashboardFeeds({ feeds, onAddFeed, onViewAll, onDeleteFeed }) {
  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Rss className="h-5 w-5" />
            Your Feeds
          </span>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {feeds.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No feeds yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Add your first feed to get started
            </p>
            <Button
              onClick={onAddFeed}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Feed
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {feeds.slice(0, 5).map((feed) => (
              <div
                key={feed.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center">
                  {feed.type === "youtube" ? (
                    <Youtube className="h-5 w-5 text-red-500" />
                  ) : (
                    <Rss className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {feed.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {feed.type}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {feed.last_synced_at
                        ? new Date(feed.last_synced_at).toLocaleDateString()
                        : "Never synced"}
                    </span>
                  </div>
                </div>
                {onDeleteFeed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteFeed(feed.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
