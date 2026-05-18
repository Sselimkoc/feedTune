"use client";

import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import { Button } from "@/components/core/ui/button";
import { FavoriteDetailCard } from "@/components/features/favorites/FavoriteDetailCard";
import { useFeedService } from "@/hooks/features/useFeedService";
import { AnimatedPageBackground } from "@/components/shared/AnimatedPageBackground";
import { PageLoadingState, PageErrorState, PageEmptyState } from "@/components/core/states/PageStates";

export function FavoritesContent() {
  const { t } = useTranslation();
  const { favorites: items, isLoading, error, toggleFavorite, toggleReadLater } = useFeedService();

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

      <div className="relative z-10 px-4 md:px-8">
        <header className="w-full max-w-screen-2xl mx-auto mt-0 md:mt-8 mb-4 md:mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Heart className="h-5 w-5 md:h-7 md:w-7 text-blue-600 shrink-0" />
            <div>
              <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-blue-500 drop-shadow-sm leading-tight">
                {t("favorites.title")}
              </h1>
              <p className="hidden sm:block text-muted-foreground text-sm md:text-base max-w-2xl">
                {t("favorites.description")}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            size="sm"
            className="text-xs md:text-sm shrink-0"
          >
            {t("common.refresh")}
          </Button>
        </header>

        <div className="w-full max-w-screen-2xl mx-auto">
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <FavoriteDetailCard
                key={item.id}
                video={item}
                onToggleFavorite={toggleFavorite}
                onToggleReadLater={toggleReadLater}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
