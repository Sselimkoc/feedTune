"use client";

import { FavoritesList } from "@/components/features/favorites/FavoritesList";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFavoritesScreen } from "@/hooks/features/useFavoritesScreen";

export function FavoritesContent() {
  const { t } = useLanguage();
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

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("favorites.title")}</h1>
          <p className="text-muted-foreground">{t("favorites.description")}</p>
        </div>
      </div>

      <FavoritesList
        initialItems={items}
        isLoading={isLoading}
        onToggleRead={toggleRead}
        onToggleFavorite={toggleFavorite}
        onToggleReadLater={toggleReadLater}
        onRefresh={refresh}
        isError={isError}
        error={error}
      />
    </div>
  );
}
