import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/core/ui/card";
import { Button } from "@/components/core/ui/button";
import { Badge } from "@/components/core/ui/badge";
import {
  Rss,
  Youtube,
  ArrowRight,
  Plus,
  Trash2,
  Clock,
  FileText,
} from "lucide-react";

export function DashboardFeeds({ feeds, onAddFeed, onViewAll, onDeleteFeed }) {
  // Group feeds by type
  const groupedFeeds = feeds.reduce((acc, feed) => {
    if (!acc[feed.type]) acc[feed.type] = [];
    acc[feed.type].push(feed);
    return acc;
  }, {});

  const displayFeeds = feeds.slice(0, 5);

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Rss className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div>Your Feeds</div>
              <div className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-1">
                {feeds.length} total feeds
              </div>
            </div>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {feeds.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No feeds yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Add your first feed to get started with curated content
            </p>
            <Button
              onClick={onAddFeed}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Feed
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayFeeds.map((feed) => (
              <div
                key={feed.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-700/30 dark:to-transparent hover:from-gray-100 dark:hover:from-gray-700/50 transition-all duration-200 group border border-gray-100 dark:border-gray-700/50"
              >
                {/* Feed Type Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center border border-blue-200/50 dark:border-blue-400/30">
                    {feed.type === "youtube" ? (
                      <Youtube className="h-6 w-6 text-red-500" />
                    ) : (
                      <Rss className="h-6 w-6 text-blue-500" />
                    )}
                  </div>
                </div>

                {/* Feed Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                    {feed.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge
                      variant="secondary"
                      className="text-xs capitalize bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    >
                      {feed.type === "youtube" ? "YouTube" : "RSS"}
                    </Badge>
                    {feed.last_synced_at && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(feed.last_synced_at).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete Button */}
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

            {/* Feed Type Summary */}
            {feeds.length > 5 && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    And {feeds.length - 5} more feeds
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onViewAll}
                    className="text-blue-600 dark:text-blue-400"
                  >
                    View All
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
