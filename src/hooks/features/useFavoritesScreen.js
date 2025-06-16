"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useFeedService } from "./useFeedService";
import { useAuthenticatedUser } from "@/hooks/auth/useAuthenticatedUser";
import { toast } from "sonner";
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
  const { userId, isLoading: isLoadingUser } = useAuthenticatedUser();
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Feed servisi hook'unu kullan
  const {
    favorites,
    isLoadingFavorites: isLoading,
    isError,
    error,
    refreshFavorites: refresh,
    toggleRead,
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
        toast.error(t("errors.loginRequired"));
        return false;
      }

      try {
        await toggleFavorite(itemId, false);
        return true;
      } catch (error) {
        console.error("Favori kaldırma hatası:", error);
        toast.error(t("errors.general"));
        return false;
      }
    },
    [userId, toggleFavorite, t]
  );

  return {
    // Veri durumu
    items: sortedFavorites,
    isLoading,
    isError,
    error,

    // Eylemler
    refresh,
    toggleRead,
    toggleFavorite: removeFavorite,
    toggleReadLater,

    // Stats
    totalFavorites: sortedFavorites.length,
  };
}
