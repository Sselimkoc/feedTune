"use client";

import { useTranslation } from "react-i18next";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/core/ui/button";
import { FavoriteDetailCard } from "./FavoriteDetailCard";
import { useFeedService } from "@/hooks/features/useFeedService";
import { toast } from "@/components/core/ui/use-toast";
import { useCallback } from "react";
import { AnimatedPageBackground } from "@/components/shared/AnimatedPageBackground";
import { PageLoadingState, PageErrorState, PageEmptyState } from "@/components/core/states/PageStates";

export function FavoritesContent() {
  const { t } = useTranslation();
  const {
    favorites: items,
    isLoading,
    error,
    toggleFavorite,
    toggleReadLater,
  } = useFeedService();

  // Handle item click
  const handleItemClick = useCallback((url) => {
    if (!url) {
      toast({
        title: t("common.error"),
        description: t("errors.invalidUrl"),
        variant: "destructive",
      });
      return;
    }
    
    window.open(url, "_blank", "noopener,noreferrer");
  }, [t]);
  
  // Handle share
  const handleShare = useCallback((item) => {
    if (navigator.share && item.url) {
      navigator.share({
        title: item.title,
        text: item.description,
        url: item.url,
      }).catch((error) => console.error("Error sharing:", error));
    } else if (item.url) {
      navigator.clipboard.writeText(item.url)
        .then(() => toast({
          title: t("common.copied"),
          description: t("common.urlCopied"),
        }))
        .catch((error) => console.error("Error copying:", error));
    }
  }, [t]);

  if (isLoading) return <PageLoadingState />;
  if (error) return <PageErrorState message={error?.message} />;

  if (!items || items.length === 0) {
    return (
      <PageEmptyState
        title={t("favorites.emptyTitle")}
        description={t("favorites.emptyDescription")}
        buttonText={t("favorites.emptyButton")}
        buttonLink="/feeds"
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      <AnimatedPageBackground />

      <div className="container relative z-10">
        {/* Header */}
        <header className="w-full max-w-screen-2xl mx-auto px-2 md:px-6 mt-8 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bookmark className="h-7 w-7 text-blue-600" />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-blue-500 drop-shadow-sm">
                {t("favorites.title")}
              </h1>
              <p className="text-muted-foreground text-base max-w-2xl">
                {t("favorites.description")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              size="sm"
            >
              {t("common.refresh")}
            </Button>
          </div>
        </header>
        {/* Main Content */}
        <main className="flex-1 w-full max-w-screen-2xl mx-auto px-2 md:px-6">
          <section className="flex-1">
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 px-2">
              {items.map((item) => (
                <FavoriteDetailCard
                  key={item.id}
                  video={item}
                  onToggleFavorite={toggleFavorite}
                  onToggleReadLater={toggleReadLater}
                  onShare={handleShare}
                  onClick={handleItemClick}
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
