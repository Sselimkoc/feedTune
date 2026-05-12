"use client";

import { useState } from "react";
import { useSession } from "@/hooks/auth/useSession";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useFeedsSummary } from "@/hooks/features/useFeedsQuery";
import { useFeedService } from "@/hooks/features/useFeedService";
import { AddFeedDialog } from "@/components/features/feed/dialogs/AddFeedDialog";
import { DashboardLoadingState } from "@/components/home/states/DashboardLoadingState";
import { DashboardWelcome } from "@/components/home/sections/DashboardWelcome";
import { DashboardStats } from "@/components/home/sections/DashboardStats";
import { DashboardFeeds } from "@/components/home/sections/DashboardFeeds";
import { DashboardActivity } from "@/components/home/sections/DashboardActivity";

export default function DashboardContent() {
  const { user, isLoading } = useSession();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { addFeedMutation, feedsQuery, itemsQuery, deleteFeed } = useFeedService();
  const { data: stats = {}, isLoading: isLoadingStats } = useFeedsSummary();
  const { t } = useTranslation();

  if (isLoading || isLoadingStats) return <DashboardLoadingState />;

  const handleDeleteFeed = (feedId) => {
    if (confirm(t("home.dashboard.deleteConfirm"))) {
      deleteFeed(feedId);
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Animated background blobs — matches app-wide pattern */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div
          className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "10s" }}
        />
        <div
          className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "14s" }}
        />
        <div
          className="absolute top-2/3 right-1/4 w-80 h-80 bg-violet-500/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "18s" }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-6 max-w-6xl space-y-5">
        <DashboardWelcome
          user={user}
          onAddFeed={() => setIsDialogOpen(true)}
          onRefresh={() => window.location.reload()}
        />

        {/* <DashboardStats stats={stats} feeds={feedsQuery.data || []} /> */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DashboardFeeds
            feeds={feedsQuery.data || []}
            onAddFeed={() => setIsDialogOpen(true)}
            onViewAll={() => router.push("/feeds")}
            onDeleteFeed={handleDeleteFeed}
          />
          <DashboardActivity
            recentItems={itemsQuery.data?.slice(0, 6) || []}
            onViewAll={() => router.push("/feeds")}
          />
        </div>
      </div>

      <AddFeedDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        addFeedMutation={addFeedMutation}
      />
    </div>
  );
}
