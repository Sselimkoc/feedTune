"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/hooks/auth/useSession";
import { useSearchParams } from "next/navigation";
import HomeHero from "@/components/public-home/HomeHero";
import { HomeAbout } from "@/components/public-home/HomeAbout";
import { HomeTechnology } from "@/components/public-home/HomeTechnology";
import { HomeShowcase } from "@/components/public-home/HomeShowcase";
import { HomeCommunity } from "@/components/public-home/HomeCommunity";
import { AuthModal } from "@/components/features/auth/AuthModal";
import { DashboardLoadingState } from "@/components/home/states/DashboardLoadingState";
import DashboardContent from "@/components/home/DashboardContent";

export function HomeContent({ initialSession }) {
  const { user, isLoading: isSessionLoading } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState("login");
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("verified") === "1") {
      setAuthModalTab("login");
      setShowAuthModal(true);
    }
  }, [searchParams]);

  const handleAuthClick = () => {
    setAuthModalTab("login");
    setShowAuthModal(true);
  };

  const renderContent = () => {
    // Sunucu session yok diyorsa loading göstermeden direkt public sayfa
    if (isSessionLoading && initialSession === null) {
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
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} defaultTab={authModalTab} />
    </>
  );
}
