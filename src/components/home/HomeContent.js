"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "@/hooks/auth/useSession";
import { useFeedService } from "@/hooks/features/useFeedService";
import HomeHero from "@/components/public-home/HomeHero";
import { HomeAbout } from "@/components/public-home/HomeAbout";
import { HomeTechnology } from "@/components/public-home/HomeTechnology";
import { HomeShowcase } from "@/components/public-home/HomeShowcase";
import { HomeCommunity } from "@/components/public-home/HomeCommunity";
import { AuthModal } from "@/components/features/auth/AuthModal";
import { useRouter } from "next/navigation";
import { DashboardLoadingState } from "@/components/home/states/DashboardLoadingState";
import DashboardContent from "@/components/home/DashboardContent";

export function HomeContent({
  feeds: initialFeeds = [],
  stats: initialStats = {},
  recentItems: initialRecentItems = [],
}) {
  const { user, isLoading: isSessionLoading } = useSession();
  const router = useRouter();
  const { deleteFeed } = useFeedService();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [feeds, setFeeds] = useState(initialFeeds);
  const [stats, setStats] = useState(initialStats);
  const [recentItems, setRecentItems] = useState(initialRecentItems);
  const [isDataLoading, setIsDataLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setIsDataLoading(true);
      try {
        const resFeeds = await fetch("/api/feeds");
        const feedsData = await resFeeds.json();
        setFeeds(feedsData.feeds || []);
        setStats(feedsData.stats || {});
        setRecentItems(feedsData.recentItems || []);
      } catch (error) {
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

  useEffect(() => {
    if (!isSessionLoading && !user) {
      router.replace("/");
    }
  }, [isSessionLoading, user, router]);

  const handleDeleteFeed = useCallback(
    async (feedId) => {
      try {
        await deleteFeed(feedId);
        window.location.reload();
      } catch (error) {
        console.error("Error deleting feed:", error);
      }
    },
    [deleteFeed]
  );

  const handleAuthClick = () => setShowAuthModal(true);

  const renderContent = () => {
    if (isSessionLoading) {
      return <DashboardLoadingState />;
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
      />
    );
  };

  return (
    <>
      {renderContent()}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}
