"use client";

import { useState, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { useFavoritesScreen } from "@/hooks/features/useFavoritesScreen";
import { useHotkeys } from "react-hotkeys-hook";
import { Bookmark } from "lucide-react";
import { ContentCard } from "@/components/shared/ContentCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const FavoritesContent = memo(function FavoritesContent() {
  const { t } = useTranslation();
  const {
    items,
    isLoading,
    isError,
    error,
    refresh,
    toggleRead,
    toggleFavorite,
    toggleReadLater,
    totalFavorites,
  } = useFavoritesScreen();

  // State
  const [viewMode] = useState("grid");

  // Event Handlers
  const handleToggleFavorite = useCallback(
    async (itemId, newValue) => {
      return await toggleFavorite(itemId, newValue);
    },
    [toggleFavorite]
  );

  const handleToggleReadLater = useCallback(
    async (itemId, newValue) => {
      return await toggleReadLater(itemId, newValue);
    },
    [toggleReadLater]
  );

  const handleItemClick = useCallback(
    async (url, item) => {
      if (url) {
        window.open(url, "_blank");
        if (item && !item.is_read) {
          try {
            await toggleRead(item.id, true);
          } catch (error) {
            console.error("İçerik okundu işaretlenemedi:", error);
          }
        }
      }
    },
    [toggleRead]
  );

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Background animated patterns */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div
          className="absolute top-1/4 right-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "10s" }}
        ></div>
        <div
          className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "12s" }}
        ></div>
        <div
          className="absolute top-1/2 left-2/3 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "14s" }}
        ></div>
        <div
          className="absolute top-1/3 left-1/4 w-40 h-40 bg-sky-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "16s" }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "18s" }}
        ></div>
      </div>

      <div className="container relative z-10">
        {/* Header */}
        <header className="w-full max-w-screen-2xl mx-auto px-2 md:px-6 mt-8 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bookmark className="h-7 w-7 text-emerald-600" />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-emerald-500 drop-shadow-sm">
                {t("favorites.title")}
              </h1>
              <p className="text-muted-foreground text-base max-w-2xl">
                {t("favorites.description")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refresh} size="sm">
              {t("common.refresh")}
            </Button>
          </div>
        </header>
        {/* Main Content */}
        <main className="flex-1 w-full max-w-screen-2xl mx-auto px-2 md:px-6">
          <section className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <span className="animate-pulse text-lg text-muted-foreground">
                  {t("common.loading")}
                </span>
              </div>
            ) : isError ? (
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
                  className="bg-emerald-600 hover:bg-emerald-700 dark:bg-primary dark:hover:bg-primary/90"
                >
                  {t("common.retry")}
                </Button>
              </div>
            ) : !items || items.length === 0 ? (
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
                  className="bg-emerald-600 hover:bg-emerald-700 dark:bg-primary dark:hover:bg-primary/90"
                  asChild
                >
                  <Link href="/feeds">{t("favorites.emptyButton")}</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {items.map((item) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    viewMode="grid"
                    cardType="favorite"
                    onFavorite={() =>
                      handleToggleFavorite(item.id, !item.is_favorite)
                    }
                    onReadLater={() =>
                      handleToggleReadLater(item.id, !item.is_read_later)
                    }
                    onClick={() => handleItemClick(item.url, item)}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
});
