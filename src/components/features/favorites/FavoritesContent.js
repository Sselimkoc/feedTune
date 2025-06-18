"use client";

import { useTranslation } from "react-i18next";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/core/ui/button";
import Link from "next/link";
import { FavoriteDetailCard } from "./FavoriteDetailCard";
import { useFeedService } from "@/hooks/features/useFeedService";

export function FavoritesContent() {
  const { t } = useTranslation();
  const {
    favorites: items,
    isLoading,
    error,
    toggleFavorite,
    toggleReadLater,
  } = useFeedService();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="animate-pulse text-lg text-muted-foreground">
          {t("common.loading")}
        </span>
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
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <img
          src="/images/placeholder.webp"
          alt="Boş"
          className="w-32 h-32 opacity-60 mb-4"
        />
        <span className="text-lg font-semibold mb-2">
          {t("favorites.emptyTitle")}
        </span>
        <span className="text-muted-foreground mb-4">
          {t("favorites.emptyDescription")}
        </span>
        <Button
          variant="outline"
          className="bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90"
          asChild
        >
          <Link href="/feeds">{t("favorites.emptyButton")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Background animated patterns */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div
          className="absolute top-1/4 right-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "10s" }}
        ></div>
        <div
          className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "12s" }}
        ></div>
        <div
          className="absolute top-1/2 left-2/3 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "14s" }}
        ></div>
        <div
          className="absolute top-1/3 left-1/4 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "16s" }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "18s" }}
        ></div>
      </div>

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
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
