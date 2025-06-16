"use client";

import { useState, useCallback, useEffect } from "react";
import { ContentContainer } from "@/components/shared/ContentContainer";
import { FeedSidebar } from "@/components/features/feeds/layout/FeedSidebar";
import { FeedToolbar } from "@/components/features/feeds/layout/FeedToolbar";
import { KeyboardShortcutsDialog } from "@/components/features/feeds/dialogs/KeyboardShortcutsDialog";
import { useFeedScreen } from "@/hooks/features/useFeedScreen";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Newspaper, RssIcon, Youtube } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Feed ekranı ana bileşeni
 */
export function FeedScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Feed screen hook'unu kullan
  const {
    feeds,
    items,
    selectedFeed,
    viewMode,
    stats,

    // Durum
    isLoading,
    isTransitioning,
    isRefreshing,
    isError,
    error,
    isEmpty,
    isLoadingMore,
    pagination,

    // İşlemler
    toggleRead,
    toggleFavorite,
    toggleReadLater,
    loadMoreItems,
    refreshAll,
    refreshFeed,

    // Görünüm işlemleri
    setViewMode,
    setActiveFilter,

    // Feed işlemleri
    syncFeeds,
    addFeed,
    removeFeed,

    // Toplu işlemler
    bulkActions,
  } = useFeedScreen();

  // URL parametrelerinden feed ID'sini al
  const feedIdFromUrl = searchParams?.get("feedId");

  // Feed tipi/kaynak tipi belirle (youtube, rss vb.)
  const contentType = selectedFeed?.type || "default";

  // Feed başlığını ve açıklamasını belirle
  const getFeedTitle = useCallback(() => {
    if (selectedFeed) {
      return selectedFeed.title;
    }
    return t("feeds.allFeeds");
  }, [selectedFeed, t]);

  const getFeedDescription = useCallback(() => {
    if (selectedFeed) {
      const unreadCount = selectedFeed.unread_count || 0;
      const totalCount = selectedFeed.item_count || 0;

      return t("feeds.feedDescription", {
        unread: unreadCount,
        total: totalCount,
      });
    }

    return t("feeds.allFeedsDescription", {
      total: stats?.totalItems || 0,
      unread: stats?.unreadItems || 0,
    });
  }, [selectedFeed, stats, t]);

  // Feed simgesini belirle
  const getFeedIcon = useCallback(() => {
    if (!selectedFeed) return <Newspaper />;

    switch (selectedFeed.type) {
      case "youtube":
        return <Youtube className="text-red-500" />;
      case "rss":
        return <RssIcon className="text-blue-500" />;
      default:
        return <Newspaper />;
    }
  }, [selectedFeed]);

  // Öğe tıklama işleyicisi
  const handleItemClick = useCallback(
    (item) => {
      // İşlem yapmadan önce öğenin URL'sini kontrol et
      if (!item || !item.url) {
        toast.error(t("errors.invalidUrl"));
        return;
      }

      // Öğeyi okundu olarak işaretle
      if (!item.is_read) {
        toggleRead(item.id, true);
      }

      // Öğe URL'sine yönlendir
      window.open(item.url, "_blank", "noopener,noreferrer");
    },
    [toggleRead, t]
  );

  // Favori değiştirme işleyicisi - optimistik uI
  const handleToggleFavorite = useCallback(
    (item) => {
      if (!item || !item.id) return;

      const newState = !item.is_favorite;
      toggleFavorite(item.id, newState);

      // Toast kullanarak geri bildirim
      toast.success(
        newState
          ? t("feeds.addedToFavorites")
          : t("feeds.removedFromFavorites"),
        {
          position: "bottom-right",
          duration: 2000,
        }
      );
    },
    [toggleFavorite, t]
  );

  // Daha sonra oku değiştirme işleyicisi
  const handleToggleReadLater = useCallback(
    (item) => {
      if (!item || !item.id) return;

      const newState = !item.is_read_later;
      toggleReadLater(item.id, newState);

      // Toast kullanarak geri bildirim
      toast.success(
        newState
          ? t("feeds.addedToReadLater")
          : t("feeds.removedFromReadLater"),
        {
          position: "bottom-right",
          duration: 2000,
        }
      );
    },
    [toggleReadLater, t]
  );

  // Yenileme işlemi
  const handleRefresh = useCallback(async () => {
    try {
      if (selectedFeed) {
        await refreshFeed(selectedFeed.id);
      } else {
        await refreshAll();
      }

      toast.success(t("feeds.refreshSuccess"));
    } catch (error) {
      toast.error(t("feeds.refreshError"));
      console.error("Yenileme hatası:", error);
    }
  }, [selectedFeed, refreshFeed, refreshAll, t]);

  // Feed seçme işleyicisi
  const handleFeedSelect = useCallback(
    (feedId) => {
      // Feed ID boşsa tüm beslemeleri göster
      if (!feedId) {
        router.push("/feeds");
        setActiveFilter(null);
        return;
      }

      // Seçilen feed'in URL'sine yönlendir
      router.push(`/feeds?feedId=${feedId}`);
      setActiveFilter(feedId);
    },
    [router, setActiveFilter]
  );

  // View mode değiştirme işleyicisi
  const handleViewModeChange = useCallback(
    (mode) => {
      setViewMode(mode);
    },
    [setViewMode]
  );

  return (
    <>
      <ContentContainer
        headerTitle={getFeedTitle()}
        headerDescription={getFeedDescription()}
        headerIcon={getFeedIcon()}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onRefresh={handleRefresh}
        contentType={contentType}
        items={items}
        isLoading={isLoading}
        isTransitioning={isTransitioning}
        isRefreshing={isRefreshing}
        isError={isError}
        error={error}
        isEmpty={isEmpty}
        emptyTitle={
          selectedFeed
            ? t("feeds.noItemsInFeed", { feed: selectedFeed.title })
            : t("feeds.noItems")
        }
        emptyDescription={t("feeds.tryRefreshing")}
        emptyActionText={t("feeds.refresh")}
        onEmptyAction={handleRefresh}
        onToggleFavorite={handleToggleFavorite}
        onToggleReadLater={handleToggleReadLater}
        onItemClick={handleItemClick}
        sidebar={
          <FeedSidebar
            feeds={feeds}
            selectedFeedId={feedIdFromUrl}
            stats={stats}
            onFeedSelect={handleFeedSelect}
            onAddFeed={addFeed}
            onRemoveFeed={removeFeed}
            onSyncFeeds={syncFeeds}
          />
        }
        toolbar={
          <FeedToolbar
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onRefresh={handleRefresh}
            onOpenKeyboardShortcuts={() => setIsShortcutsOpen(true)}
            bulkActions={bulkActions}
          />
        }
        hasMore={pagination?.hasNextPage}
        loadMoreItems={loadMoreItems}
        isLoadingMore={isLoadingMore}
      />

      {/* Klavye kısayolları diyaloğu */}
      <KeyboardShortcutsDialog
        isOpen={isShortcutsOpen}
        onOpenChange={setIsShortcutsOpen}
      />
    </>
  );
}
