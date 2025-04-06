"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useFeedService } from "./useFeedService";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Daha Sonra Oku ekranı için özelleştirilmiş hook
 * Bu hook, daha sonra okunacak içerikleri yönetmek için gerekli verileri ve fonksiyonları sağlar
 * @returns {Object} Daha sonra okunacak içeriklerle ilgili veriler ve fonksiyonlar
 */
export function useReadLaterScreen() {
  const { t } = useLanguage();
  const { user } = useAuthStore();

  // Feed servisi hook'unu kullan
  const {
    readLaterItems,
    isLoadingReadLater: isLoading,
    isError,
    error,
    refreshReadLater: refresh,
    toggleRead,
    toggleFavorite,
    toggleReadLater: originalToggleReadLater,
  } = useFeedService();

  // Daha sonra oku içeriklerini sırala (en yeni üstte)
  const sortedItems = useMemo(() => {
    if (!readLaterItems) return [];

    return [...readLaterItems].sort(
      (a, b) => new Date(b.published_at) - new Date(a.published_at)
    );
  }, [readLaterItems]);

  // Bir öğeyi daha sonra oku listesinden kaldır
  const handleToggleReadLater = useCallback(
    async (itemId, isReadLater) => {
      if (!user) {
        toast.error(t("errors.loginRequired"));
        return;
      }

      try {
        await originalToggleReadLater(itemId, isReadLater);
        return true;
      } catch (error) {
        console.error("Daha sonra oku durumu değiştirme hatası:", error);
        toast.error(t("errors.general"));
        return false;
      }
    },
    [user, originalToggleReadLater, t]
  );

  return {
    // Veri durumu
    items: sortedItems,
    isLoading,
    isError,
    error,

    // Eylemler
    refresh,
    toggleRead,
    toggleFavorite,
    toggleReadLater: handleToggleReadLater,

    // Stats
    totalReadLater: sortedItems.length,
  };
}
