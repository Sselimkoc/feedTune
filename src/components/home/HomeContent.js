"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useHomeFeeds } from "@/hooks/features/useHomeFeeds";
import { useFeedManagement } from "@/hooks/features/useFeedManagement";
import { HomeStats } from "@/components/home/HomeStats";
import { HomeFeedManagement } from "@/components/home/HomeFeedManagement";
import { HomeRecentContent } from "@/components/home/HomeRecentContent";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeFeatures } from "@/components/home/HomeFeatures";
import { HomeModals } from "@/components/home/HomeModals";
import { EmptyState } from "@/components/ui-states/EmptyState";
import { LoadingState } from "@/components/ui-states/LoadingState";
import { ErrorState } from "@/components/ui-states/ErrorState";

export function HomeContent() {
  // State yönetimi
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddFeedDialog, setShowAddFeedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [feedToDelete, setFeedToDelete] = useState(null);

  // Hook'lar
  const { user } = useAuthStore();
  const { feeds, recentItems, stats, isLoading, isError, error, refresh } =
    useHomeFeeds();
  const { deleteFeed, isDeleting } = useFeedManagement();

  // Feed silme işleyicisi
  const handleDeleteFeed = async () => {
    if (feedToDelete) {
      await deleteFeed(feedToDelete);
      setShowDeleteDialog(false);
      setFeedToDelete(null);
    }
  };

  // İçerik render fonksiyonu
  const renderContent = () => {
    if (!user) {
      return (
        <>
          <HomeHero onAuthClick={() => setShowAuthModal(true)} />
          <HomeFeatures />
        </>
      );
    }

    if (isLoading) {
      return <LoadingState />;
    }

    if (isError) {
      return <ErrorState onRetry={refresh} error={error} />;
    }

    if (!feeds || feeds.length === 0) {
      return <EmptyState onAddFeed={() => setShowAddFeedDialog(true)} />;
    }

    return (
      <div className="space-y-8">
        <HomeStats stats={stats} />
        <HomeFeedManagement
          feeds={feeds}
          onAddFeed={() => setShowAddFeedDialog(true)}
          onDeleteFeed={(feedId) => {
            setFeedToDelete(feedId);
            setShowDeleteDialog(true);
          }}
        />
        <HomeRecentContent recentItems={recentItems} />
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {renderContent()}

      {/* Modals */}
      <HomeModals
        showAuthModal={showAuthModal}
        setShowAuthModal={setShowAuthModal}
        showAddFeedDialog={showAddFeedDialog}
        setShowAddFeedDialog={setShowAddFeedDialog}
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        onDeleteFeed={handleDeleteFeed}
        isDeleting={isDeleting}
        onFeedAdded={refresh}
      />
    </div>
  );
}
