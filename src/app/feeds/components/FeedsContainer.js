"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { FeedLayout } from "./FeedLayout";
import { FeedHeader } from "./FeedHeader";
import { FeedGrid } from "./FeedGrid";
import { FilterDialog } from "@/components/features/feeds/dialogs/FilterDialog";
import { KeyboardShortcutsDialog } from "@/components/features/feeds/dialogs/KeyboardShortcutsDialog";
import { EmptyState } from "./EmptyState";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { useFeeds } from "@/hooks/features/useFeeds";
import { useFeedActions } from "@/app/feeds/hooks/useFeedActions";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeedStore, getFilteredItems } from "@/store/useFeedStore";

export function FeedsContainer() {
  // Dil ve çeviriler
  const { t } = useLanguage();

  // Zustand store'dan state ve aksiyonları al
  const feeds = useFeedStore((state) => state.feeds);
  const isLoading = useFeedStore((state) => state.isLoading);
  const isError = useFeedStore((state) => state.isError);
  const error = useFeedStore((state) => state.error);
  const selectedFeedId = useFeedStore((state) => state.selectedFeedId);
  const filters = useFeedStore((state) => state.filters);
  const viewMode = useFeedStore((state) => state.viewMode);
  const setFeeds = useFeedStore((state) => state.setFeeds);
  const setItems = useFeedStore((state) => state.setItems);
  const setSelectedFeed = useFeedStore((state) => state.setSelectedFeed);
  const setViewMode = useFeedStore((state) => state.setViewMode);
  const setFilters = useFeedStore((state) => state.setFilters);
  const updateLocalItem = useFeedStore((state) => state.updateLocalItem);
  const setLoading = useFeedStore((state) => state.setLoading);
  const setError = useFeedStore((state) => state.setError);
  const dataLoaded = useFeedStore((state) => state.dataLoaded);

  // UI State
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);

  // Data fetching hook
  const {
    feeds: apiFeeds,
    items: apiItems,
    isLoading: apiLoading,
    isError: apiError,
    error: apiErrorData,
    refetch,
  } = useFeeds();

  // Feed actions
  const {
    toggleItemRead: apiToggleItemRead,
    toggleItemFavorite: apiToggleFavorite,
    toggleItemReadLater: apiToggleReadLater,
  } = useFeedActions();

  // Oturum durumunu kontrol et
  const { user, checkSession } = useAuthStore();

  // Query parametreleri
  const searchParams = useSearchParams();

  // API'den gelen verileri store'a aktar
  useEffect(() => {
    if (apiLoading) {
      setLoading(true);
    }

    if (apiError) {
      setError(apiErrorData);
    }

    if (apiFeeds && !apiLoading) {
      setFeeds(apiFeeds);
    }

    if (apiItems && !apiLoading) {
      setItems(apiItems);
      dataLoaded();
    }
  }, [
    apiFeeds,
    apiItems,
    apiLoading,
    apiError,
    apiErrorData,
    setFeeds,
    setItems,
    setLoading,
    setError,
    dataLoaded,
  ]);

  // URL'den feed ID'yi al
  useEffect(() => {
    const feedId = searchParams.get("feedId");
    if (feedId) {
      setSelectedFeed(feedId);
    } else if (feeds && feeds.length > 0 && !selectedFeedId) {
      setSelectedFeed(feeds[0].id);
    }
  }, [searchParams, feeds, selectedFeedId, setSelectedFeed]);

  // Oturum kontrolü
  useEffect(() => {
    const verifySession = async () => {
      if (!user) {
        console.warn("Oturum bilgisi bulunamadı, kontrol ediliyor...");
        await checkSession();
      }
    };

    verifySession();
  }, [user, checkSession]);

  // Filtreleri uygulama
  const handleApplyFilters = useCallback(
    (newFilters) => {
      setFilters(newFilters);
    },
    [setFilters]
  );

  // Yenileme işlemi
  const handleRefresh = useCallback(async () => {
    try {
      setLoading(true);
      const refreshedData = await refetch();
      console.log("Veriler yenilendi:", refreshedData);

      if (refreshedData && refreshedData.items) {
        setItems(refreshedData.items);
      }

      if (refreshedData && refreshedData.feeds) {
        setFeeds(refreshedData.feeds);
      }

      dataLoaded();
      toast.success(t("feeds.refreshed"));
    } catch (error) {
      console.error("Yenileme hatası:", error);
      setError(error);
      toast.error(t("errors.refreshFailed"));
    }
  }, [refetch, t, setLoading, setItems, setFeeds, dataLoaded, setError]);

  // Hata durumunda yeniden deneme
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // Feed seçme
  const handleFeedSelect = useCallback(
    (feedId) => {
      setSelectedFeed(feedId);

      // URL'yi güncelle (opsiyonel)
      const url = new URL(window.location);
      url.searchParams.set("feedId", feedId);
      window.history.pushState({}, "", url);
    },
    [setSelectedFeed]
  );

  // İyimser güncellemeler ile buton işlevleri
  const handleToggleRead = useCallback(
    (itemId, isRead) => {
      console.log("FeedsContainer: handleToggleRead çalıştı", itemId, isRead);

      // İyimser güncelleme - store'u doğrudan güncelle
      updateLocalItem(itemId, { is_read: isRead });

      // API çağrısı
      apiToggleItemRead({
        itemId,
        isRead,
        userId: user?.id,
        skipInvalidation: true,
      });
    },
    [updateLocalItem, apiToggleItemRead, user]
  );

  const handleToggleFavorite = useCallback(
    (itemId, isFavorite) => {
      console.log(
        "FeedsContainer: handleToggleFavorite çalıştı",
        itemId,
        isFavorite
      );

      // İyimser güncelleme - store'u doğrudan güncelle
      updateLocalItem(itemId, { is_favorite: isFavorite });

      // API çağrısı
      apiToggleFavorite({
        itemId,
        isFavorite,
        userId: user?.id,
        skipInvalidation: true,
      });
    },
    [updateLocalItem, apiToggleFavorite, user]
  );

  const handleToggleReadLater = useCallback(
    (itemId, isReadLater) => {
      console.log(
        "FeedsContainer: handleToggleReadLater çalıştı",
        itemId,
        isReadLater
      );

      // İyimser güncelleme - store'u doğrudan güncelle
      updateLocalItem(itemId, { is_read_later: isReadLater });

      // API çağrısı
      apiToggleReadLater({
        itemId,
        isReadLater,
        userId: user?.id,
        skipInvalidation: true,
      });
    },
    [updateLocalItem, apiToggleReadLater, user]
  );

  // Duruma göre içerik gösterme
  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState onRetry={handleRetry} error={error} />;
  }

  if (!feeds || feeds.length === 0) {
    return <EmptyState />;
  }

  // Seçili feed'i bul
  const selectedFeed =
    feeds.find((feed) => feed.id === selectedFeedId) || feeds[0];

  // Filtrelenmiş ve sıralanmış öğeleri al
  const sortedItems = getFilteredItems();

  return (
    <FeedLayout>
      {/* Üst bilgi çubuğu */}
      <FeedHeader
        feeds={feeds}
        selectedFeedId={selectedFeedId}
        onFeedSelect={handleFeedSelect}
        onOpenFilters={() => setFilterDialogOpen(true)}
        onShowKeyboardShortcuts={() => setShortcutsDialogOpen(true)}
        onRefresh={handleRefresh}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* İçerik grid/liste görünümü */}
      <FeedGrid
        items={sortedItems}
        feeds={feeds}
        viewMode={viewMode}
        onToggleRead={handleToggleRead}
        onToggleFavorite={handleToggleFavorite}
        onToggleReadLater={handleToggleReadLater}
      />

      {/* Diyaloglar */}
      <FilterDialog
        isOpen={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        filters={filters}
        onApplyFilters={handleApplyFilters}
      />

      <KeyboardShortcutsDialog
        isOpen={shortcutsDialogOpen}
        onOpenChange={setShortcutsDialogOpen}
      />
    </FeedLayout>
  );
}
