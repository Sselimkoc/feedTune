"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useFeedService } from "./useFeedService";
import { useAuth } from "@/hooks/auth/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";
import { usePagination } from "@/hooks/features/feed-screen/usePagination";

/**
 * Favoriler ekranı için özelleştirilmiş hook
 * Bu hook, favori içerikleri yönetmek için gerekli verileri ve fonksiyonları sağlar
 * @returns {Object} Favori içeriklerle ilgili veriler ve fonksiyonlar
 */
export function useFavoritesScreen() {
  const { t } = useTranslation();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const userId = user?.id;
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { toast } = useToast();

  // Feed servisi hook'unu kullan
  const {
    favorites,
    isLoadingFavorites: isLoading,
    isError,
    error,
    refreshFavorites: refresh,
    markItemRead,
    toggleFavorite,
    toggleReadLater,
  } = useFeedService();

  // Favori içerikleri sırala (en yeni üstte)
  const sortedFavorites = useMemo(() => {
    if (!favorites || favorites.length === 0) return [];

    // Doğrudan filtreleri ve sıralamayı birleştirerek daha verimli hale getiriyoruz
    return [...favorites].sort(
      (a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0)
    );
  }, [favorites]);

  // Bir öğeyi favorilerden kaldır
  const removeFavorite = useCallback(
    async (itemId) => {
      if (!userId) {
        toast({
          title: t("errors.authRequired"),
          description: t("errors.pleaseLoginToAddFeeds"),
          variant: "destructive",
        });
        return false;
      }

      try {
        await toggleFavorite(itemId, false);
        toast({
          title: t("common.success"),
          description: t("feeds.removeFromFavoritesSuccess"),
          variant: "default",
        });
        return true;
      } catch (error) {
        console.error("Favori kaldırma hatası:", error);
        toast({
          title: t("common.error"),
          description: error.message || t("errors.general"),
          variant: "destructive",
        });
        return false;
      }
    },
    [userId, toggleFavorite, toast, t]
  );

  return {
    // Veri durumu
    items: sortedFavorites,
    isLoading: isLoading || isLoadingAuth,
    isError,
    error,

    // Eylemler
    refresh,
    markItemRead,
    toggleFavorite: removeFavorite,
    toggleReadLater,

    // Stats
    totalFavorites: sortedFavorites.length,
  };
}
