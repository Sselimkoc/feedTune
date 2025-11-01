import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/core/ui/card";
import { Button } from "@/components/core/ui/button";
import {
  Activity,
  Rss,
  Youtube,
  Calendar,
  ArrowRight,
  ExternalLink,
  Zap,
} from "lucide-react";

export function DashboardActivity({ recentItems, onViewAll }) {
  const getTimeAgo = (date) => {
    const now = new Date();
    const published = new Date(date);
    const seconds = Math.floor((now - published) / 1000);
    
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div>Recent Activity</div>
              <div className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-1">
                Latest from your feeds
              </div>
            </div>
          </span>
          <Button variant="ghost" size="sm" onClick={onViewAll} className="hover:bg-green-50 dark:hover:bg-green-900/20">
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No recent activity
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Your recent feed activity will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentItems.map((item, index) => (
              <div
                key={item.id}
                className="group relative flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-700/30 dark:to-transparent hover:from-green-50 dark:hover:from-green-700/20 transition-all duration-200 border border-gray-100 dark:border-gray-700/50"
              >
                {/* Timeline indicator */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 ${
                    index === 0 
                      ? 'bg-green-500 border-green-300 dark:border-green-400' 
                      : 'bg-gray-300 dark:bg-gray-600 border-gray-200 dark:border-gray-500'
                  } transition-all group-hover:scale-125`} />
                  {index < recentItems.length - 1 && (
                    <div className="w-0.5 h-12 bg-gradient-to-b from-gray-300 to-transparent dark:from-gray-600 dark:to-transparent mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                          {item.type === "youtube" ? (
                            <>
                              <Youtube className="h-3 w-3 text-red-500" />
                              <span>YouTube</span>
                            </>
                          ) : (
                            <>
                              <Rss className="h-3 w-3 text-blue-500" />
                              <span>RSS</span>
                            </>
                          )}
                        </span>
                        {item.published_at && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {getTimeAgo(item.published_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => window.open(item.url || item.link, "_blank")}
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
