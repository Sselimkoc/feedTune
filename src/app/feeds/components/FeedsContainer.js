"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useFeedScreen } from "@/hooks/features/useFeedScreen";
import { useHotkeys } from "react-hotkeys-hook";
import { useLanguage } from "@/hooks/useLanguage";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KeyboardShortcuts } from "@/components/features/general/KeyboardShortcuts";
import { SidebarNavigation } from "@/components/features/navigation/SidebarNavigation";
import { ResizablePanelGroup, ResizablePanel } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FeedSidebar } from "./navigation/FeedSidebar";
import { FeedHeader } from "./FeedHeader";
import { FeedGrid } from "./FeedGrid";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { EmptyFilterState } from "./EmptyFilterState";
import { AddFeedDialog } from "@/components/features/feeds/dialogs/AddFeedDialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function FeedsContainer() {
  const { settings } = useSettingsStore();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const userId = user?.id;

  // Feed ekranı hook'u
  const {
    feeds = [],
    items: feedItems = [],
    isLoading: isLoadingFeeds = false,
    isLoadingItems = false,
    error,
    viewMode = "grid",
    filters,
    activeFilter = "all",
    stats = {},
    selectedFeed,
    setViewMode = () => {},
    setActiveFilter = () => {},
    setSelectedFeed = () => {},
    getSelectedFeedId = () => selectedFeed?.id,
    handleRefresh = () => Promise.resolve(),
    handleSyncFeeds = () => Promise.resolve(),
    handleToggleRead = () => Promise.resolve(),
    handleToggleFavorite = () => Promise.resolve(),
    handleToggleReadLater = () => Promise.resolve(),
    handleMarkAllRead = () => Promise.resolve(),
    handleRemoveFeed = () => Promise.resolve(),
    handleAddFeed = () => Promise.resolve(),
    handleShareItem = () => {},
    handleLoadMoreItems = () => Promise.resolve(),
    hasMoreItems = false,
    isLoadingMore = false,
    searchQuery = "",
    setSearchQuery = () => {},
    applyFilters = () => {},
    resetFilters = () => {},
    filteredItems = feedItems || [],
    setFocusedItemId = () => {},
    focusedItemId = null,
    cleanupOldItems = () => Promise.resolve(),
  } = useFeedScreen() || {};

  // UI Durumları
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showAddFeedDialog, setShowAddFeedDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Sol menü görünürlük kontrolü
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Feed tipini belirle (tüm, okunmamış, favoriler, vb.)
  const feedType = useMemo(() => {
    // Eğer selectedFeed bir string ise ve "filter:" içeriyorsa, filtreyi kullan
    // Eğer selectedFeed bir string değilse veya "filter:" içermiyorsa null döndür
    if (!selectedFeed) {
      // selectedFeed yoksa activeFilter'a göre seç
      switch (activeFilter) {
        case "unread":
          return "filter:unread";
        case "favorites":
          return "filter:favorites";
        case "readLater":
          return "filter:readLater";
        case "rss":
          return "filter:rss";
        case "youtube":
          return "filter:youtube";
        case "read":
          return "filter:read";
        default:
          return "filter:all";
      }
    } else if (
      typeof selectedFeed === "string" &&
      selectedFeed.includes("filter:")
    ) {
      // Eğer selectedFeed bir filter string ise, olduğu gibi döndür
      return selectedFeed;
    } else {
      // Eğer selectedFeed bir ID ise, null döndür
      return null;
    }
  }, [activeFilter, selectedFeed]);

  // İstatistikleri hazırla
  const feedStats = useMemo(() => {
    return {
      total: stats.totalItems || 0,
      unread: stats.unreadItems || 0,
      favorites: stats.favoriteItems || 0,
      readLater: stats.readLaterItems || 0,
      rssFeeds: Array.isArray(feeds)
        ? feeds.filter((f) => f.type === "rss").length
        : 0,
      youtubeFeeds: Array.isArray(feeds)
        ? feeds.filter((f) => f.type === "youtube").length
        : 0,
    };
  }, [stats, feeds]);

  // Otomatik yenileme için interval
  useEffect(() => {
    // Kullanıcı ayarlarından yenileme süresini al
    const refreshInterval = settings.refreshInterval || 5;
    const intervalMs = refreshInterval * 60 * 1000; // Dakikayı milisaniyeye çevir

    const interval = setInterval(() => {
      handleRefresh();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [handleRefresh, settings.refreshInterval]);

  // Yenileme ve senkronizasyon işlemleri
  const handleRefreshAndSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await handleSyncFeeds();
      // Başarılı senkronizasyon sonrası içeriği yenile
      await handleRefresh();
      // Eskimiş içerikleri temizle (30 günden eski, favori olmayan ve daha sonra okunmayacak olanlar)
      if (userId) {
        const deleted = await cleanupOldItems(userId, 30, true, true);
        if (deleted > 0) {
          toast({
            title: t("feeds.cleanupSuccess") || "Temizleme Başarılı",
            description:
              t("feeds.cleanupDescription", { count: deleted }) ||
              `${deleted} eski içerik başarıyla kaldırıldı.`,
          });
        }
      }
    } catch (error) {
      console.error("Sync or refresh error:", error);
      toast({
        variant: "destructive",
        title: t("feeds.syncError") || "Senkronizasyon Hatası",
        description:
          t("feeds.syncErrorDescription") ||
          "Feed'ler yenilenirken bir sorun oluştu. Lütfen tekrar deneyin.",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [handleSyncFeeds, handleRefresh, cleanupOldItems, userId, t, toast]);

  // Filtreleri sıfırla
  const handleResetFilters = useCallback(() => {
    setIsResetting(true);
    setSelectedFeed(null);
    setActiveFilter("all");
    resetFilters();
    setTimeout(() => setIsResetting(false), 500);
  }, [setSelectedFeed, setActiveFilter, resetFilters]);

  // Tüm feed'leri okundu olarak işaretle
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await handleMarkAllRead(selectedFeed?.id);
      toast({
        title: t("feeds.allMarkedAsRead") || "Hepsi Okundu Olarak İşaretlendi",
        description: selectedFeed
          ? t("feeds.feedMarkedAsRead", { title: selectedFeed.title }) ||
            `"${selectedFeed.title}" içeriği okundu olarak işaretlendi.`
          : t("feeds.allItemsMarkedAsRead") ||
            "Tüm içerikler okundu olarak işaretlendi.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("feeds.markAsReadError") || "İşlem Hatası",
        description:
          t("feeds.markAsReadErrorDescription") ||
          "İçerikler okundu olarak işaretlenirken bir sorun oluştu.",
      });
    }
  }, [handleMarkAllRead, selectedFeed, t, toast]);

  // İçerik tıklama işlemi
  const handleItemClick = useCallback(
    (item) => {
      if (!item) return;

      const url = item.url || item.link;
      if (url) {
        window.open(url, "_blank");
      } else {
        console.error("Item URL bulunamadı:", item);
        return;
      }

      if (item && !item.isRead && typeof handleToggleRead === "function") {
        handleToggleRead(item);
      }
    },
    [handleToggleRead]
  );

  // Feed ekleme
  const handleAddFeedClick = useCallback(() => {
    setShowAddFeedDialog(true);
  }, []);

  // Klavye kısayollarını yönet
  useHotkeys("?", () => setShowKeyboardShortcuts(true), {
    enableOnTags: ["INPUT"],
  });
  useHotkeys("r", () => handleRefresh(), { enableOnTags: ["INPUT"] });
  useHotkeys("g", () => setViewMode("grid"), { enableOnTags: ["INPUT"] });
  useHotkeys("l", () => setViewMode("list"), { enableOnTags: ["INPUT"] });
  useHotkeys("esc", () => {
    if (showKeyboardShortcuts) setShowKeyboardShortcuts(false);
  });

  // FeedSidebar component için filter ve feed selectiom işleyicilerini useCallback ile optimize ediyorum
  const handleFeedSelect = useCallback(
    (feedOrFilter) => {
      // Performans kontrolü: eğer aynı değer zaten seçiliyse işlem yapma
      if (feedOrFilter === selectedFeed) return;

      // feedOrFilter bir string ve "filter:" ile başlıyorsa, bir filtre seçilmiş demektir
      if (
        typeof feedOrFilter === "string" &&
        feedOrFilter?.startsWith("filter:")
      ) {
        const filter = feedOrFilter.replace("filter:", "");

        // Eğer activeFilter zaten aynıysa ve seçili feed yoksa değiştirme yapmamıza gerek yok
        if (activeFilter === filter && selectedFeed === feedOrFilter) {
          return;
        }

        setActiveFilter(filter); // Aktif filtreyi ayarla

        // Yalnızca gerekirse selectedFeed'i güncelle
        if (selectedFeed !== feedOrFilter) {
          setSelectedFeed(feedOrFilter); // selectedFeed'e filter string'ini ata
        }
      } else {
        // Aksi takdirde, bir feed seçilmiş demektir (ID)

        // Eğer zaten aynı feed seçili ise değiştirme yapmamıza gerek yok
        if (selectedFeed === feedOrFilter) {
          return;
        }

        setSelectedFeed(feedOrFilter); // Feed ID'sini ata

        // Yalnızca gerekirse activeFilter'ı güncelle
        if (activeFilter !== "all") {
          setActiveFilter("all"); // Feed seçildiğinde aktif filtreyi resetle
        }
      }
    },
    [selectedFeed, activeFilter, setSelectedFeed, setActiveFilter]
  );

  // Memoize edilmiş içerik
  const renderContent = useMemo(() => {
    if (filteredItems.length === 0 && !isLoadingItems) {
      return (
        <EmptyFilterState
          onRefresh={handleRefresh}
          onResetFilters={handleResetFilters}
          onAddFeed={handleAddFeedClick}
        />
      );
    }

    return (
      <FeedGrid
        items={filteredItems}
        isLoading={isLoadingItems}
        viewMode={viewMode}
        onItemClick={handleItemClick}
        onItemMarkRead={(item) => handleToggleRead(item.id, true)}
        onItemMarkUnread={(item) => handleToggleRead(item.id, false)}
        onItemFavorite={(item) =>
          handleToggleFavorite(item.id, !(item.is_favorite || item.isFavorite))
        }
        onItemReadLater={(item) =>
          handleToggleReadLater(
            item.id,
            !(item.is_read_later || item.isReadLater)
          )
        }
        onItemShare={(item) => handleShareItem(item)}
        onRefresh={handleRefresh}
        loadMoreItems={handleLoadMoreItems}
        hasMoreItems={hasMoreItems}
        isLoadingMore={isLoadingMore}
        focusedItemId={focusedItemId}
      />
    );
  }, [
    filteredItems,
    isLoadingItems,
    viewMode,
    handleRefresh,
    handleResetFilters,
    handleAddFeedClick,
    handleItemClick,
    handleToggleRead,
    handleToggleFavorite,
    handleToggleReadLater,
    handleShareItem,
    handleLoadMoreItems,
    hasMoreItems,
    isLoadingMore,
    focusedItemId,
  ]);

  // Yükleme, hata ve boş durumlar
  if (isLoadingFeeds && !feeds.length) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={handleRefresh} />;
  }

  if (!feeds || feeds.length === 0) {
    return <EmptyState onAddFeed={handleAddFeedClick} />;
  }

  return (
    <div className="w-full h-full overflow-hidden">
      <ResizablePanelGroup
        direction="horizontal"
        className="h-[calc(100vh-2rem)]"
      >
        {/* Sol Panel - Yan Menü */}
        <ResizablePanel
          defaultSize={isSidebarCollapsed ? 5 : 20}
          minSize={isSidebarCollapsed ? 5 : 15}
          maxSize={isSidebarCollapsed ? 5 : 30}
          className="bg-background/95 backdrop-blur-sm border-r"
        >
          <FeedSidebar
            feeds={feeds}
            selectedFeedId={getSelectedFeedId()}
            onFeedSelect={handleFeedSelect}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            activeFilter={activeFilter}
            onAddFeed={handleAddFeedClick}
            onMarkAllRead={handleMarkAllAsRead}
            onRemoveFeed={handleRemoveFeed}
            stats={feedStats}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => {
              const newState = !isSidebarCollapsed;
              setIsSidebarCollapsed(newState);
              // Force resize panel değişiklikleri uygulamak için timeout ekliyoruz
              setTimeout(() => {
                window.dispatchEvent(new Event("resize"));
              }, 50);
            }}
          />
        </ResizablePanel>

        {/* Sağ Panel - İçerik */}
        <ResizablePanel
          defaultSize={isSidebarCollapsed ? 95 : 80}
          className="overflow-hidden"
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <FeedHeader
              selectedFeed={selectedFeed}
              feedType={feedType}
              itemCount={filteredItems.length}
              unreadCount={feedStats.unread}
              onRefresh={handleRefreshAndSync}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onShowKeyboardShortcuts={() => setShowKeyboardShortcuts(true)}
              onAddFeed={handleAddFeedClick}
              isSyncing={isSyncing}
              onSearch={setSearchQuery}
              searchQuery={searchQuery}
              filters={filters}
              applyFilters={applyFilters}
              resetFilters={handleResetFilters}
              stats={feedStats}
            />

            {/* İçerik - Memoized content */}
            <div className="flex-1 overflow-auto pt-2 px-3">
              {renderContent}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Diyaloglar */}
      {/* Klavye Kısayolları */}
      <Dialog
        open={showKeyboardShortcuts}
        onOpenChange={setShowKeyboardShortcuts}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="font-mono text-xs border rounded px-1">?</span>
              {t("shortcuts.title") || "Klavye Kısayolları"}
            </DialogTitle>
          </DialogHeader>
          <KeyboardShortcuts />
        </DialogContent>
      </Dialog>

      {/* Feed Ekleme Diyaloğu */}
      <AddFeedDialog
        isOpen={showAddFeedDialog}
        onOpenChange={setShowAddFeedDialog}
        onFeedAdded={handleRefresh}
      />
    </div>
  );
}
