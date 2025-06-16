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
import HomeHero from "@/components/home/HomeHero";
import { HomeFeatures } from "@/components/home/HomeFeatures";
import { HomeAbout } from "@/components/home/HomeAbout";
import { HomeTechnology } from "@/components/home/HomeTechnology";
import { HomeModals } from "@/components/home/HomeModals";
import { EmptyState } from "@/components/ui-states/EmptyState";
import { LoadingState } from "@/components/ui-states/LoadingState";
import { ErrorState } from "@/components/ui-states/ErrorState";
import { useLanguage } from "@/hooks/useLanguage";

export function HomeContent() {
  const { user } = useSession();
  const { t } = useLanguage();

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
          <HomeFeatures />
          <HomeAbout />
          <HomeTechnology />
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
    <div className="min-h-screen">
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
  );
}
