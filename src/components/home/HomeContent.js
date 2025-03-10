"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeeds } from "@/hooks/features/useFeeds";
import { useHomeData } from "@/hooks/features/useHomeData";
import { useDeleteFeed } from "@/hooks/features/useDeleteFeed";
import { HomeStats } from "@/components/home/HomeStats";
import { HomeFeedManagement } from "@/components/home/HomeFeedManagement";
import { HomeRecentContent } from "@/components/home/HomeRecentContent";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeFeatures } from "@/components/home/HomeFeatures";
import { HomeModals } from "@/components/home/HomeModals";
import { EmptyState } from "@/components/features/feeds/EmptyState";
import { LoadingState } from "@/components/features/feeds/LoadingState";
import { ErrorState } from "@/components/features/feeds/ErrorState";

export function HomeContent() {
  // State yönetimi
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddFeedDialog, setShowAddFeedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [feedToDelete, setFeedToDelete] = useState(null);

  // Hook'lar
  const { user } = useAuthStore();
  const { refetch } = useFeeds();
  const { feeds, setFeeds, recentItems, isLoading, isError, stats } =
    useHomeData();
  const { isDeleting, handleRemoveFeed } = useDeleteFeed();

  

  // Feed silme işleyicisi
  const handleDeleteFeed = async () => {
    const success = await handleRemoveFeed(feedToDelete, () => {
      setFeeds((prevFeeds) => prevFeeds.filter((f) => f.id !== feedToDelete));
      refetch();
    });

    if (success) {
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
      return <ErrorState onRetry={refetch} />;
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
        onFeedAdded={refetch}
      />
    </div>
  );
}
