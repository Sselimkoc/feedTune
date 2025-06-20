"use client";

import { useState, useCallback } from "react";
import { Toast } from "../core/ui/toast";
import { useSession } from "@/hooks/auth/useSession";
import { useFeedService } from "@/hooks/features/useFeedService";
import { HomeStats } from "@/components/home/HomeStats";
import { HomeFeedManagement } from "@/components/home/HomeFeedManagement";
import { HomeRecentContent } from "@/components/home/HomeRecentContent";
import HomeHero from "@/components/public-home/HomeHero";
import { HomeAbout } from "@/components/public-home/HomeAbout";
import { HomeTechnology } from "@/components/public-home/HomeTechnology";
import { HomeShowcase } from "@/components/public-home/HomeShowcase";
import { HomeCommunity } from "@/components/public-home/HomeCommunity";
import { HomeModals } from "@/components/home/HomeModals";
import { EmptyState } from "@/components/core/states/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";

export function HomeContent({ feeds = [], stats = {}, recentItems = [] }) {
  const { user, isLoading, deleteFeed } = useFeedService();
  const { t } = useLanguage();

  // Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddFeedDialog, setShowAddFeedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [feedToDelete, setFeedToDelete] = useState(null);

  // Feed management handlers
  const handleDeleteFeed = useCallback(
    async (feedId) => {
      try {
        await deleteFeed(feedId);
        window.location.reload();
      } catch (error) {
        console.error("Error deleting feed:", error);
        toast.error(t("feeds.deleteFeedError", { error: error.message }));
      }
    },
    [deleteFeed, t]
  );

  const handleAddFeed = () => setShowAddFeedDialog(true);
  const handleAuthClick = () => setShowAuthModal(true);

  // Content render function
  const renderContent = () => {
    if (isLoading || feeds === undefined || feeds === null) {
      return (
        <div className="flex justify-center items-center h-96">
          <span className="animate-pulse text-lg text-muted-foreground">
            {t("common.loading")}
          </span>
        </div>
      );
    }
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
    if (Array.isArray(feeds) && feeds.length === 0) {
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
        <HomeRecentContent recentItems={recentItems} isLoading={false} />
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
          onFeedAdded={() => window.location.reload()}
          feedToDelete={feedToDelete}
        />
      </div>
    </section>
  );
}
