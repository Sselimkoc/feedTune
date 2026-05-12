"use client";

import { useState, useCallback } from "react";
import { useSession } from "@/hooks/auth/useSession";
import { useFeedService } from "@/hooks/features/useFeedService";
import { useFeedsSummary } from "@/hooks/features/useFeedsQuery";
import HomeHero from "@/components/public-home/HomeHero";
import { HomeAbout } from "@/components/public-home/HomeAbout";
import { HomeTechnology } from "@/components/public-home/HomeTechnology";
import { HomeShowcase } from "@/components/public-home/HomeShowcase";
import { HomeCommunity } from "@/components/public-home/HomeCommunity";
import { AuthModal } from "@/components/features/auth/AuthModal";
import { DashboardLoadingState } from "@/components/home/states/DashboardLoadingState";
import DashboardContent from "@/components/home/DashboardContent";

export function HomeContent() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);

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

    return <DashboardContent />;
  };

  return (
    <>
      {renderContent()}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}
