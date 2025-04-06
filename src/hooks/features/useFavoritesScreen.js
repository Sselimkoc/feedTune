"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useFeedService } from "./useFeedService";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Favoriler ekranı için özelleştirilmiş hook
 * Bu hook, favori içerikleri yönetmek için gerekli verileri ve fonksiyonları sağlar
 * @returns {Object} Favori içeriklerle ilgili veriler ve fonksiyonlar
 */
export function useFavoritesScreen() {
  const { t } = useLanguage();
  const { user } = useAuthStore();

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
    if (!favorites) return [];

    return [...favorites].sort(
      (a, b) => new Date(b.published_at) - new Date(a.published_at)
    );
  }, [favorites]);

  // Bir öğeyi favorilerden kaldır
  const removeFavorite = useCallback(
    async (itemId) => {
      if (!user) {
        toast.error(t("errors.loginRequired"));
        return;
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
    [user, toggleFavorite, t]
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
