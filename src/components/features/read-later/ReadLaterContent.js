"use client";

import { useTranslation } from "react-i18next";
import { BookmarkCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/core/ui/button";
import { FavoriteDetailCard } from "../favorites/FavoriteDetailCard";
import { useFeedService } from "@/hooks/features/useFeedService";
import { toast } from "@/components/core/ui/use-toast";
import { useCallback } from "react";
import { EmptyState } from "@/components/core/states/EmptyState";
import { AnimatedPageBackground } from "@/components/shared/AnimatedPageBackground";

export function ReadLaterContent() {
  const { t } = useTranslation();
  const {
    readLaterItems: items,
    isLoading,
    error,
    toggleReadLater,
    toggleFavorite,
  } = useFeedService();

  // Handle item click
  const handleItemClick = useCallback(
    (url, item) => {
      if (!url) {
        toast({
          title: t("common.error"),
          description: t("errors.invalidUrl"),
          variant: "destructive",
        });
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");
    },
    [t]
  );

  // Handle share
  const handleShare = useCallback(
    (item) => {
      if (navigator.share && item.url) {
        navigator
          .share({
            title: item.title,
            text: item.description,
            url: item.url,
          })
          .catch((error) => console.error("Error sharing:", error));
      } else if (item.url) {
        navigator.clipboard
          .writeText(item.url)
          .then(() =>
            toast({
              title: t("common.copied"),
              description: t("common.urlCopied"),
            })
          )
          .catch((error) => console.error("Error copying:", error));
      }
    },
    [t]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen relative">
        <AnimatedPageBackground />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-muted-foreground">{t("common.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <span className="text-destructive text-2xl font-bold mb-2">
          {t("common.error")}
        </span>
        <span className="text-muted-foreground mb-4">
          {error?.message || t("common.errorDescription")}
        </span>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90"
        >
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        title={t("readLater.emptyTitle")}
        description={t("readLater.emptyDescription")}
        buttonText={t("readLater.emptyButton")}
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
            <BookmarkCheck className="h-7 w-7 text-blue-600" />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-blue-500 drop-shadow-sm">
                {t("readLater.title")}
              </h1>
              <p className="text-muted-foreground text-base max-w-2xl">
                {t("readLater.description")}
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
