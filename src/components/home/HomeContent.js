"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useSession } from "@/hooks/auth/useSession";
import { useFeedService } from "@/hooks/features/useFeedService";
import { useFeedActions } from "@/hooks/features/feed-screen/useFeedActions";
import { feedService } from "@/services/feedService";
import { HomeStats } from "@/components/home/HomeStats";
import { HomeFeedManagement } from "@/components/home/HomeFeedManagement";
import { HomeRecentContent } from "@/components/home/HomeRecentContent";
import HomeHero from "@/components/public-home/HomeHero";
import { HomeAbout } from "@/components/public-home/HomeAbout";
import { HomeTechnology } from "@/components/public-home/HomeTechnology";
import { HomeShowcase } from "@/components/public-home/HomeShowcase";
import { HomeCommunity } from "@/components/public-home/HomeCommunity";
import { HomeModals } from "@/components/home/HomeModals";
import { EmptyState } from "@/components/ui-states/EmptyState";
import { LoadingState } from "@/components/ui-states/LoadingState";
import { ErrorState } from "@/components/ui-states/ErrorState";
import { useLanguage } from "@/hooks/useLanguage";

export function HomeContent() {
  const { user } = useSession();
  const { t } = useLanguage();
  console.log("HomeContent user:", user);

  // Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddFeedDialog, setShowAddFeedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [feedToDelete, setFeedToDelete] = useState(null);

  // Feed service hooks
  const {
    feeds,
    isFeedsLoading,
    isFeedsError,
    refreshAll,
    recentItems,
    stats,
  } = useFeedService();

  const { removeFeed } = useFeedActions(
    user,
    refreshAll,
    refreshAll,
    feedService
  );

  // Feed management handlers
  const handleDeleteFeed = useCallback(
    async (feedId) => {
      try {
        await removeFeed(feedId);
        refreshAll?.();
      } catch (error) {
        console.error("Error deleting feed:", error);
        toast.error(t("feeds.deleteFeedError", { error: error.message }));
      }
    },
    [removeFeed, refreshAll, t]
  );

  const handleAddFeed = () => setShowAddFeedDialog(true);
  const handleAuthClick = () => setShowAuthModal(true);

  // Content render function
  const renderContent = () => {
    if (!user) {
      return (
        <>
          <HomeHero onAuthClick={handleAuthClick} />
          <HomeAbout />
          <HomeShowcase />
          <HomeTechnology />
          <HomeCommunity />
        </>
      );
    }

    if (isFeedsLoading) {
      return <LoadingState />;
    }

    if (isFeedsError) {
      return <ErrorState onRetry={refreshAll} error={isFeedsError} />;
    }

    if (!feeds?.length) {
      return <EmptyState onAddFeed={handleAddFeed} />;
    }
    console.log("HomeContent user:", user);
    return (
      <div className="space-y-8">
        <HomeStats stats={stats} />
        <HomeFeedManagement
          feeds={feeds}
          onAddFeed={handleAddFeed}
          onDeleteFeed={(feedId) => {
            setFeedToDelete(feedId);
            setShowDeleteDialog(true);
          }}
        />
        <HomeRecentContent
          recentItems={recentItems}
          isLoading={isFeedsLoading}
        />
      </div>
    );
  };

  return (
    <section className="py-6 lg:py-8 relative">
      {/* Background animated patterns */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div
          className="absolute top-1/4 right-1/3 w-72 h-72 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        ></div>
        <div
          className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-primary/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "10s" }}
        ></div>
        <div
          className="absolute top-1/2 left-2/3 w-64 h-64 bg-yellow-500/5 dark:bg-primary/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "12s" }}
        ></div>
      </div>

      <div className="container relative z-10">
        {renderContent()}

        <HomeModals
          showAuthModal={showAuthModal}
          setShowAuthModal={setShowAuthModal}
          showAddFeedDialog={showAddFeedDialog}
          setShowAddFeedDialog={setShowAddFeedDialog}
          showDeleteDialog={showDeleteDialog}
          setShowDeleteDialog={setShowDeleteDialog}
          onDeleteFeed={handleDeleteFeed}
          isDeleting={false}
          onFeedAdded={refreshAll}
          feedToDelete={feedToDelete}
        />
      </div>
    </section>
  );
}
