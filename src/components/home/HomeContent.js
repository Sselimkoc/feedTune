"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "@/hooks/auth/useSession";
import { useFeedService } from "@/hooks/features/useFeedService";
import HomeHero from "@/components/public-home/HomeHero";
import { HomeAbout } from "@/components/public-home/HomeAbout";
import { HomeTechnology } from "@/components/public-home/HomeTechnology";
import { HomeShowcase } from "@/components/public-home/HomeShowcase";
import { HomeCommunity } from "@/components/public-home/HomeCommunity";

import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";
import { AuthModal } from "@/components/features/auth/AuthModal";
import { useToast } from "@/components/core/ui/use-toast";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/core/ui/skeleton";
import Link from "next/link";
import DashboardContent from "@/components/home/DashboardContent";

export function HomeContent({
  initialSession,
  feeds: initialFeeds = [],
  stats: initialStats = {},
  recentItems: initialRecentItems = [],
}) {
  const { user, isLoading: isSessionLoading } = useSession();
  const router = useRouter();
  const { t } = useLanguage();

  // Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [feedToDelete, setFeedToDelete] = useState(null);

  // Data states
  const [feeds, setFeeds] = useState(initialFeeds);
  const [stats, setStats] = useState(initialStats);
  const [recentItems, setRecentItems] = useState(initialRecentItems);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Use addFeed from useFeedService
  const { addFeed } = useFeedService();
  const { toast } = useToast();

  // Use deleteFeed from useFeedService
  const { deleteFeed } = useFeedService();

  // Fetch feeds and related data after session is available
  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setIsDataLoading(true);
      try {
        // Fetch feeds
        const resFeeds = await fetch("/api/feeds");
        const feedsData = await resFeeds.json();
        setFeeds(feedsData.feeds || []);
        setStats(feedsData.stats || {});
        setRecentItems(feedsData.recentItems || []);
      } catch (error) {
        // Optionally handle error
        setFeeds([]);
        setStats({});
        setRecentItems([]);
      } finally {
        setIsDataLoading(false);
      }
    }
    if (user) {
      fetchData();
    }
  }, [user]);

  // Redirect to home if not logged in after session loading
  useEffect(() => {
    if (!isSessionLoading && !user) {
      router.replace("/");
    }
  }, [isSessionLoading, user, router]);

  // Feed management handlers
  const handleDeleteFeed = useCallback(
    async (feedId) => {
      try {
        await deleteFeed(feedId);
        window.location.reload();
      } catch (error) {
        console.error("Error deleting feed:", error);
        toast({
          title: t("common.error"),
          description: t("feeds.deleteFeedError", { error: error.message }),
          variant: "destructive",
        });
      }
    },
    [deleteFeed, t]
  );

  const handleAuthClick = () => setShowAuthModal(true);

  const renderContent = () => {
    if (isSessionLoading) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (!user) {
      return (
        <>
          <HomeHero onAuthClick={handleAuthClick} />
          <HomeAbout />
          <HomeTechnology />
          <HomeShowcase />
          <HomeCommunity />
        </>
      );
    }

    return (
      <DashboardContent
        feeds={feeds}
        stats={stats}
        recentItems={recentItems}
        isLoading={isDataLoading}
        onDeleteFeed={handleDeleteFeed}
        onAddFeed={addFeed}
        onAuthClick={handleAuthClick}
      />
    );
  };

  return (
    <>
      {renderContent()}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
