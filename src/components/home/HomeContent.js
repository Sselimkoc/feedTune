"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "@/hooks/auth/useSession";
import { useFeedService } from "@/hooks/features/useFeedService";
import { useFeedsSummary } from "@/hooks/features/useFeedsQuery";
import HomeHero from "@/components/public-home/HomeHero";
import { HomeAbout } from "@/components/public-home/HomeAbout";
import { HomeTechnology } from "@/components/public-home/HomeTechnology";
import { HomeShowcase } from "@/components/public-home/HomeShowcase";
import { HomeCommunity } from "@/components/public-home/HomeCommunity";
import { AuthModal } from "@/components/features/auth/AuthModal";
import { useRouter } from "next/navigation";
import { DashboardLoadingState } from "@/components/home/states/DashboardLoadingState";
import DashboardContent from "@/components/home/DashboardContent";

export function HomeContent() {
  const { user, isLoading: isSessionLoading } = useSession();
  const router = useRouter();
  const { deleteFeed } = useFeedService();

  // Use React Query for caching - only fetches when user is authenticated
  const { data: stats = {}, isLoading: isDataLoading } = useFeedsSummary();

  const [showAuthModal, setShowAuthModal] = useState(false);

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
        stats={stats}
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
