"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/hooks/auth/useSession";
import { useRouter } from "next/navigation";
import { useFeedService } from "@/hooks/features/useFeedService";
import { AddFeedDialog } from "@/components/features/feed/dialogs/AddFeedDialog";
import { DashboardLoadingState } from "@/components/home/states/DashboardLoadingState";
import { DashboardWelcome } from "@/components/home/sections/DashboardWelcome";
import { DashboardStats } from "@/components/home/sections/DashboardStats";
import { DashboardActions } from "@/components/home/sections/DashboardActions";
import { DashboardFeeds } from "@/components/home/sections/DashboardFeeds";
import { DashboardActivity } from "@/components/home/sections/DashboardActivity";

export default function DashboardContent({ onDeleteFeed }) {
  const { user, isLoading } = useSession();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    feeds,
    items,
    favorites,
    readLaterItems,
    isLoading: isLoadingFeeds,
    refreshAllFeeds,
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

  const recentItems = items?.slice(0, 5) || [];

  if (isLoading || isLoadingFeeds) {
    return <DashboardLoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <DashboardWelcome user={user} />
        </div>

        {/* Stats Cards */}
        <div className="mb-8">
          <DashboardStats stats={stats} />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <DashboardActions
            onAddFeed={() => setIsDialogOpen(true)}
            onRefresh={refreshAllFeeds}
            onFavorites={() => router.push("/favorites")}
            onReadLater={() => router.push("/read-later")}
          />
        </div>

        {/* Feed Overview and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DashboardFeeds
            feeds={feeds}
            onAddFeed={() => setIsDialogOpen(true)}
            onViewAll={() => router.push("/feeds")}
            onDeleteFeed={onDeleteFeed}
          />
          <DashboardActivity
            recentItems={recentItems}
            onViewAll={() => router.push("/feeds")}
          />
        </div>
      </div>

      {/* Add Feed Dialog */}
      <AddFeedDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
