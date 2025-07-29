"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/hooks/auth/useSession";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { useRouter } from "next/navigation";
import { useFeedService } from "@/hooks/features/useFeedService";
import { AddFeedDialog } from "@/components/features/feed/dialogs/AddFeedDialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/core/ui/card";
import { Button } from "@/components/core/ui/button";
import { Badge } from "@/components/core/ui/badge";
import { Skeleton } from "@/components/core/ui/skeleton";
import {
  Plus,
  RefreshCw,
  Star,
  Bookmark,
  Eye,
  Rss,
  Youtube,
  TrendingUp,
  Calendar,
  Clock,
  Users,
  Activity,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function DashboardContent() {
  const { user, isLoading } = useSession();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    feeds,
    items,
    favorites,
    readLaterItems,
    isLoading: isLoadingFeeds,
    refreshAllFeeds,
    addFeed,
  } = useFeedService();

  const [stats, setStats] = useState({
    totalFeeds: 0,
    totalItems: 0,
    totalFavorites: 0,
    totalReadLater: 0,
    unreadItems: 0,
    feedsByType: { rss: 0, youtube: 0 },
  });

  // Calculate stats when data changes
  useEffect(() => {
    if (feeds && items) {
      const unreadItems = items.filter((item) => !item.is_read).length;
      const feedsByType = feeds.reduce((acc, feed) => {
        acc[feed.type] = (acc[feed.type] || 0) + 1;
        return acc;
      }, {});

      setStats({
        totalFeeds: feeds.length,
        totalItems: items.length,
        totalFavorites: favorites?.length || 0,
        totalReadLater: readLaterItems?.length || 0,
        unreadItems,
        feedsByType,
      });
    }
  }, [feeds?.length, items?.length, favorites?.length, readLaterItems?.length]);

  // Get recent items
  const recentItems = items?.slice(0, 5) || [];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to FeedTune
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Your personal feed aggregator and content curator
            </p>
            <Button
              onClick={() => router.push("/auth")}
              className="bg-primary hover:bg-primary/90"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || isLoadingFeeds) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Welcome back, {user.email?.split("@")[0]}! 👋
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Here's what's happening with your feeds today
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {user.email?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        {/* Quick Actions */}
        <div className="mb-8">
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
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feed
                </Button>
                <Button
                  variant="outline"
                  onClick={refreshAllFeeds}
                  className="border-gray-200 dark:border-gray-600"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync All
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/favorites")}
                  className="border-gray-200 dark:border-gray-600"
                >
                  <Star className="h-4 w-4 mr-2" />
                  View Favorites
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/read-later")}
                  className="border-gray-200 dark:border-gray-600"
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  Read Later
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feed Overview and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Feed Overview */}
          <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Rss className="h-5 w-5" />
                  Your Feeds
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/feeds")}
                >
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
                    onClick={() => setIsDialogOpen(true)}
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
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                              ? new Date(
                                  feed.last_synced_at
                                ).toLocaleDateString()
                              : "Never synced"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/feeds")}
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No recent activity
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Your recent feed activity will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 group-hover:scale-125 transition-transform" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            {item.type === "youtube" ? (
                              <Youtube className="h-3 w-3" />
                            ) : (
                              <Rss className="h-3 w-3" />
                            )}
                            {item.channelName || item.feed_title}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {item.published_at
                              ? new Date(item.published_at).toLocaleDateString()
                              : "-"}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() =>
                          window.open(item.url || item.link, "_blank")
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Feed Dialog */}
      <AddFeedDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
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
