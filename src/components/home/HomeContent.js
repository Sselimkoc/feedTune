"use client";

import { useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useSession } from "@/hooks/auth/useSession";
import { useFeedService } from "@/hooks/features/useFeedService";
import { useFeedActions } from "@/hooks/features/feed-screen/useFeedActions";
import { feedService } from "@/services/feedService";
import { HomeStats } from "@/components/home/HomeStats";
import { HomeFeedManagement } from "@/components/home/HomeFeedManagement";
import { HomeRecentContent } from "@/components/home/HomeRecentContent";
import HomeHero from "@/components/home/HomeHero";
import { HomeFeatures } from "@/components/home/HomeFeatures";
import { HomeModals } from "@/components/home/HomeModals";
import { EmptyState } from "@/components/ui-states/EmptyState";
import { LoadingState } from "@/components/ui-states/LoadingState";
import { ErrorState } from "@/components/ui-states/ErrorState";
import { useLanguage } from "@/hooks/useLanguage";

export function HomeContent() {
  const { session, user } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddFeedDialog, setShowAddFeedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [feedToDelete, setFeedToDelete] = useState(null);
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showKbdHelp, setShowKbdHelp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks
  const {
    feeds,
    isFeedsLoading,
    isFeedsError,
    refreshFeeds,
    recentItems,
    stats,
  } = useFeedService();

  const { addFeed, removeFeed, syncFeeds } = useFeedActions({
    user,
    feedService,
    refreshAll: refreshFeeds,
  });

  const handleDeleteFeed = useCallback(
    async (feedId, feedTitle) => {
      if (window.confirm(t("feeds.confirmDelete", { feed: feedTitle }))) {
        try {
          await removeFeed(feedId);
          refreshFeeds();
        } catch (error) {
          console.error("Error deleting feed:", error);
          toast.error(`${t("feeds.deleteFeedError")}: ${error.message}`);
        }
      }
    },
    [removeFeed, refreshFeeds, t]
  );

  // Content render function
  const renderContent = () => {
    if (!user) {
      return (
        <>
          <HomeHero onAuthClick={() => setShowAuthModal(true)} />
          <HomeFeatures />
        </>
      );
    }

    if (isFeedsLoading) {
      return <LoadingState />;
    }

    if (isFeedsError) {
      return <ErrorState onRetry={refreshFeeds} error={isFeedsError} />;
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

      {/* Modals */}
      <HomeModals
        showAuthModal={showAuthModal}
        setShowAuthModal={setShowAuthModal}
        showAddFeedDialog={showAddFeedDialog}
        setShowAddFeedDialog={setShowAddFeedDialog}
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        onDeleteFeed={handleDeleteFeed}
        isDeleting={false}
        onFeedAdded={refreshFeeds}
      />
    </div>
  );
}
