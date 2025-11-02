"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/hooks/auth/useSession";
import { useRouter } from "next/navigation";
import { useFeedsSummary } from "@/hooks/features/useFeedsQuery";
import { useFeedService } from "@/hooks/features/useFeedService";
import { AddFeedDialog } from "@/components/features/feed/dialogs/AddFeedDialog";
import { DashboardLoadingState } from "@/components/home/states/DashboardLoadingState";
import { DashboardWelcome } from "@/components/home/sections/DashboardWelcome";
import { DashboardStats } from "@/components/home/sections/DashboardStats";
import { DashboardActions } from "@/components/home/sections/DashboardActions";
import { DashboardFeeds } from "@/components/home/sections/DashboardFeeds";
import { DashboardActivity } from "@/components/home/sections/DashboardActivity";

export default function DashboardContent() {
  const { user, isLoading } = useSession();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { addFeedMutation, feedsQuery, itemsQuery } = useFeedService();

  const { data: stats = {}, isLoading: isLoadingStats } = useFeedsSummary();

  if (isLoading || isLoadingStats) {
    return <DashboardLoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <DashboardWelcome user={user} />
        </div>

        {/* Stats */}
        <div className="mb-8">
          <DashboardStats stats={stats} feeds={feedsQuery.data || []} />
        </div>

        {/* Actions */}
        <div className="mb-8">
          <DashboardActions
            onAddFeed={() => setIsDialogOpen(true)}
            onRefresh={() => window.location.reload()}
            onFavorites={() => router.push("/favorites")}
            onReadLater={() => router.push("/read-later")}
          />
        </div>

        {/* Feeds and Recent Activity */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Feeds */}
          <div>
            <DashboardFeeds
              feeds={feedsQuery.data || []}
              onAddFeed={() => setIsDialogOpen(true)}
              onViewAll={() => router.push("/feeds")}
              onDeleteFeed={() => {}}
            />
          </div>

          {/* Recent Activity */}
          <div>
            <DashboardActivity
              recentItems={itemsQuery.data?.slice(0, 5) || []}
              onViewAll={() => router.push("/feeds")}
            />
          </div>
        </div>

        {/* Dialog */}
        <AddFeedDialog 
          isOpen={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
          addFeedMutation={addFeedMutation}
        />
      </div>
    </div>
  );
}
