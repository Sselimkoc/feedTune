"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { FeedLayout } from "./FeedLayout";
import { FeedHeader } from "./FeedHeader";
import { FeedGrid } from "./FeedGrid";
import { FilterDialog } from "@/components/features/feeds/dialogs/FilterDialog";
import { KeyboardShortcutsDialog } from "@/components/features/feeds/dialogs/KeyboardShortcutsDialog";
import { AddFeedDialog } from "@/components/features/feeds/dialogs/AddFeedDialog";
import { EmptyState } from "@/components/ui-states/EmptyState";
import { LoadingState } from "@/components/ui-states/LoadingState";
import { ErrorState } from "@/components/ui-states/ErrorState";
import { useFeedScreen } from "@/hooks/features/useFeedScreen";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Rss,
  Youtube,
  Star,
  BookmarkCheck,
  RefreshCw,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSettingsStore } from "@/store/useSettingsStore";

export function FeedsContainer() {
  // Dil ve çeviri hook'u
  const { t } = useLanguage();

  // Ayarları al
  const { settings } = useSettingsStore();

  // State yönetimi
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const [addFeedDialogOpen, setAddFeedDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [isSyncing, setIsSyncing] = useState(false);

  // React Query client
  const queryClient = useQueryClient();

  // Ana feed hook'u
  const {
    feeds,
    items,
    selectedFeed,
    selectedFeedId,
    viewMode,
    filters,
    isLoading,
    isError,
    error,
    handleFeedSelect,
    applyFilters,
    changeViewMode,
    refresh,
    silentRefresh,
    toggleRead,
    toggleFavorite,
    toggleReadLater,
    cleanupOldItems,
    isCleaningUp,
  } = useFeedScreen();

  // Dialogs için memoized handlers
  const handleOpenFilterDialog = useCallback(() => {
    setFilterDialogOpen(true);
  }, []);

  const handleCloseFilterDialog = useCallback(() => {
    setFilterDialogOpen(false);
  }, []);

  const handleOpenShortcutsDialog = useCallback(() => {
    setShortcutsDialogOpen(true);
  }, []);

  const handleCloseShortcutsDialog = useCallback(() => {
    setShortcutsDialogOpen(false);
  }, []);

  const handleOpenAddFeedDialog = useCallback(() => {
    setAddFeedDialogOpen(true);
  }, []);

  const handleCloseAddFeedDialog = useCallback(() => {
    setAddFeedDialogOpen(false);
  }, []);

  // Optimized feed toggling functions
  const handleToggleRead = useCallback(
    (itemId, isRead) => {
      toggleRead(itemId, isRead);
    },
    [toggleRead]
  );

  const handleToggleFavorite = useCallback(
    (itemId, isFavorite) => {
      toggleFavorite(itemId, isFavorite);
    },
    [toggleFavorite]
  );

  const handleToggleReadLater = useCallback(
    (itemId, isReadLater) => {
      toggleReadLater(itemId, isReadLater);
    },
    [toggleReadLater]
  );

  const handleViewModeChange = useCallback(
    (mode) => {
      changeViewMode(mode);
    },
    [changeViewMode]
  );

  // Otomatik yenileme için timer kurma
  useEffect(() => {
    // Ayarlardaki refreshInterval değerini dakikaya çevir
    const refreshTimeInMinutes = settings.refreshInterval || 5;

      console.log(
      `Feed yenileme aralığı: ${refreshTimeInMinutes} dakika olarak ayarlandı`
    );

    const intervalId = setInterval(() => {
      console.log("Otomatik yenileme gerçekleşiyor...");
      // Değişiklik: Sessiz yenileme fonksiyonunu kullan
      silentRefresh();
    }, refreshTimeInMinutes * 60 * 1000); // Dakika cinsinden ayarlanan süreyi milisaniyeye çevir

    return () => clearInterval(intervalId);
  }, [silentRefresh, settings.refreshInterval]); // settings.refreshInterval değiştiğinde yeniden oluştur

  // Hem yenileme hem de otomatik senkronizasyon yapar
  const handleRefresh = useCallback(async () => {
    // Önce senkronizasyon işlemi
    if (!isSyncing) {
      setIsSyncing(true);
      try {
        // Sunucu tarafından senkronizasyon (yeni içerikleri al)
        const response = await fetch("/api/feed-sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Feed senkronizasyon hatası");
        }

        // Sessiz bildirim (sync başarılı olduğunda)
        toast.success(
          data.message ||
            (t("feeds.syncSuccess") === "feeds.syncSuccess"
              ? "Feed'ler başarıyla güncellendi"
              : t("feeds.syncSuccess")),
          { duration: 2000 } // Daha kısa süre göster
        );

        // Eski içerikleri temizle (60 günden eski, favorileri ve sonra okuları koru)
        try {
          const cleanupResult = await cleanupOldItems({
            olderThanDays: 60, // 60 günden eski içerikler
            keepFavorites: true, // Favorileri koru
            keepReadLater: true, // Sonra oku öğelerini koru
          });

          if (cleanupResult && cleanupResult.deleted > 0) {
            console.log(`${cleanupResult.deleted} eski içerik temizlendi`);

            // Kullanıcıya bildirme (isteğe bağlı)
            if (cleanupResult.deleted > 10) {
              // Sadece önemli miktarda içerik silindiğinde bildir
              toast.info(
                t("feeds.cleanupSuccess", { count: cleanupResult.deleted }) ===
                  "feeds.cleanupSuccess"
                  ? `${cleanupResult.deleted} eski içerik veritabanından temizlendi`
                  : t("feeds.cleanupSuccess", { count: cleanupResult.deleted }),
                { duration: 3000 }
              );
            }
          }
        } catch (cleanupError) {
          console.error("Eski içerik temizleme hatası:", cleanupError);
          // Kullanıcıya hata bildirme (tercihen sessiz)
        }
      } catch (error) {
        console.error("Feed senkronizasyon hatası:", error);
        toast.error(
          error.message ||
            (t("feeds.syncError") === "feeds.syncError"
              ? "Feed'ler senkronize edilirken bir hata oluştu"
              : t("feeds.syncError"))
        );
      } finally {
        setIsSyncing(false);
      }
    }

    // Sonra normal yenileme işlemi (cache'i güncelle)
    refresh();
  }, [isSyncing, refresh, cleanupOldItems, t]);

  // Server-side senkronizasyon (artık sadece handleSyncFeeds fonksiyonu için)
  const handleSyncFeeds = useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const response = await fetch("/api/feed-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Feed senkronizasyon hatası");
      }

      toast.success(
        data.message ||
          (t("feeds.syncSuccess") === "feeds.syncSuccess"
            ? "Feed'ler başarıyla güncellendi"
            : t("feeds.syncSuccess"))
      );

      // Otomatik olarak eski içerikleri temizle (Aylardan (90 gün) eski içerikler)
      try {
        const cleanupResult = await cleanupOldItems({
          olderThanDays: 90, // 3 aydan eski içerikler
          keepFavorites: true, // Favorileri koru
          keepReadLater: true, // Sonra oku öğelerini koru
        });

        if (cleanupResult && cleanupResult.deleted > 0) {
          console.log(`${cleanupResult.deleted} eski içerik temizlendi`);

          // Kullanıcıya bildirme (isteğe bağlı)
          if (cleanupResult.deleted > 20) {
            // Sadece önemli miktarda içerik silindiğinde bildir
            toast.info(
              t("feeds.cleanupSuccess", { count: cleanupResult.deleted }) ===
                "feeds.cleanupSuccess"
                ? `${cleanupResult.deleted} eski içerik veritabanından temizlendi`
                : t("feeds.cleanupSuccess", { count: cleanupResult.deleted })
            );
          }
        }
      } catch (cleanupError) {
        console.error("Eski içerik temizleme hatası:", cleanupError);
        // Temizleme hatası kullanıcıya gösterilmeyebilir (sessiz çalışma)
      }

      // Mevcut verileri yenile
      refresh();
    } catch (error) {
      console.error("Feed senkronizasyon hatası:", error);
      toast.error(
        error.message ||
          (t("feeds.syncError") === "feeds.syncError"
            ? "Feed'ler senkronize edilirken bir hata oluştu"
            : t("feeds.syncError"))
      );
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, t, cleanupOldItems, refresh]);

  // Tüm öğeleri okundu/okunmadı olarak işaretle
  const handleMarkAllRead = useCallback(async () => {
    if (!items || items.length === 0) return;

    // Okunmamış öğeleri bul
    const unreadItems = items.filter((item) => !item.is_read);

    if (unreadItems.length === 0) {
      toast.info(
        t("feeds.allItemsAlreadyRead") === "feeds.allItemsAlreadyRead"
          ? "Tüm öğeler zaten okundu"
          : t("feeds.allItemsAlreadyRead")
      );
      return;
    }

    // Her bir öğeyi okundu olarak işaretle
    try {
      toast.info(
        t("feeds.markingAllAsRead") === "feeds.markingAllAsRead"
          ? "Tüm öğeler okundu olarak işaretleniyor..."
          : t("feeds.markingAllAsRead")
      );

      await Promise.all(unreadItems.map((item) => toggleRead(item.id, true)));

      toast.success(
        t("feeds.allItemsMarkedAsRead", { count: unreadItems.length }) ===
          `feeds.allItemsMarkedAsRead`
          ? `${unreadItems.length} öğe okundu olarak işaretlendi`
          : t("feeds.allItemsMarkedAsRead", { count: unreadItems.length })
      );

      // Verileri yenile
      refresh();
    } catch (error) {
      console.error("Toplu okuma hatası:", error);
      toast.error(
        t("errors.markReadFailed") === "errors.markReadFailed"
          ? "Öğeler işaretlenirken bir hata oluştu"
          : t("errors.markReadFailed")
      );
    }
  }, [items, toggleRead, refresh, t]);

  // Tab'a göre öğeleri filtrele - use memoized value
  const filteredItems = useMemo(() => {
    if (!items) return [];

    switch (activeTab) {
      case "unread":
        return items.filter((item) => !item.is_read);
      case "read":
        return items.filter((item) => item.is_read);
      case "youtube":
        return items.filter((item) => {
          const feed = feeds.find((f) => f.id === item.feed_id);
          return feed && feed.type === "youtube";
        });
      case "rss":
        return items.filter((item) => {
          const feed = feeds.find((f) => f.id === item.feed_id);
          return feed && feed.type === "rss";
        });
      case "all":
      default:
        return items;
    }
  }, [items, feeds, activeTab]);

  // Filtreleme seçimini yap
  const handleFilterSelect = useCallback((type) => {
    setActiveTab(type);
  }, []);

  // Feed istatistikleri - useMemo ile optimize edildi
  const stats = useMemo(
    () => ({
      total: items?.length || 0,
      unread: items?.filter((item) => !item.is_read)?.length || 0,
      favorites: items?.filter((item) => item.is_favorite)?.length || 0,
      readLater: items?.filter((item) => item.is_read_later)?.length || 0,
      youtube:
        items?.filter((item) => {
          const feed = feeds.find((f) => f.id === item.feed_id);
          return feed && feed.type === "youtube";
        })?.length || 0,
      rss:
        items?.filter((item) => {
          const feed = feeds.find((f) => f.id === item.feed_id);
          return feed && feed.type === "rss";
        })?.length || 0,
    }),
    [items, feeds]
  );

  // İçerik görüntüleme
  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState onRetry={refresh} error={error} />;
  }

  if (!feeds || feeds.length === 0) {
    return (
      <>
        <EmptyState onAddFeed={handleOpenAddFeedDialog} />
        <AddFeedDialog
          isOpen={addFeedDialogOpen}
          onOpenChange={handleCloseAddFeedDialog}
          onFeedAdded={refresh}
        />
      </>
    );
  }

  return (
    <FeedLayout>
      {/* Header */}
      <FeedHeader
        feeds={feeds}
        selectedFeedId={selectedFeedId}
        onFeedSelect={handleFeedSelect}
        onOpenFilters={handleOpenFilterDialog}
        onShowKeyboardShortcuts={handleOpenShortcutsDialog}
        onRefresh={handleRefresh}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onAddFeed={handleOpenAddFeedDialog}
        onSync={handleSyncFeeds}
        isSyncing={isSyncing}
      />

      {/* Filtreleme sekmeleri */}
      <Card className="mt-4 shadow-sm">
        <CardContent className="p-0 sm:p-4">
          <div className="flex flex-col gap-4">
            {/* İstatistikler */}
            <div className="hidden lg:flex justify-between items-center p-2">
              <div className="flex items-center space-x-4">
                <div className="flex items-center gap-1.5 text-sm">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {t("feeds.items") === "feeds.items"
                      ? "Öğeler"
                      : t("feeds.items")}
                    :
                  </span>
                  <span className="font-medium">{stats.total}</span>
                </div>

                <div className="flex items-center gap-1.5 text-sm">
                  <EyeOff className="h-4 w-4 text-blue-500" />
                  <span className="text-muted-foreground">
                    {t("feeds.unread") === "feeds.unread"
                      ? "Okunmamış"
                      : t("feeds.unread")}
                    :
                  </span>
                  <span className="font-medium">{stats.unread}</span>
                </div>

                <div className="flex items-center gap-1.5 text-sm">
                  <Rss className="h-4 w-4 text-orange-500" />
                  <span className="text-muted-foreground">RSS:</span>
                  <span className="font-medium">{stats.rss}</span>
                </div>

                <div className="flex items-center gap-1.5 text-sm">
                  <Youtube className="h-4 w-4 text-red-500" />
                  <span className="text-muted-foreground">YouTube:</span>
                  <span className="font-medium">{stats.youtube}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {stats.unread > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllRead}
                    className="text-xs"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    {t("feeds.markAllAsRead") === "feeds.markAllAsRead"
                      ? "Tümünü Okundu Say"
                      : t("feeds.markAllAsRead")}
                  </Button>
                )}
              </div>
            </div>

            {/* Tab filtreleri */}
            <ScrollArea className="w-full">
              <Tabs
                value={activeTab}
                onValueChange={handleFilterSelect}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 md:grid-cols-5 bg-transparent h-auto p-0 gap-1">
                  <TabsTrigger
                    value="all"
                    className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Filter className="h-4 w-4" />
                    <span>
                      {t("feeds.all") === "feeds.all" ? "Tümü" : t("feeds.all")}
                    </span>
                    <Badge variant="outline" className="ml-1">
                      {stats.total}
                    </Badge>
                  </TabsTrigger>

                  <TabsTrigger
                    value="unread"
                    className="flex items-center gap-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  >
                    <EyeOff className="h-4 w-4" />
                    <span>
                      {t("feeds.unread") === "feeds.unread"
                        ? "Okunmamış"
                        : t("feeds.unread")}
                    </span>
                    <Badge variant="outline" className="ml-1">
                      {stats.unread}
                    </Badge>
                  </TabsTrigger>

                  <TabsTrigger
                    value="rss"
                    className="flex items-center gap-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                  >
                    <Rss className="h-4 w-4" />
                    <span>RSS</span>
                    <Badge variant="outline" className="ml-1">
                      {stats.rss}
                    </Badge>
                  </TabsTrigger>

                  <TabsTrigger
                    value="youtube"
                    className="flex items-center gap-1 data-[state=active]:bg-red-500 data-[state=active]:text-white"
                  >
                    <Youtube className="h-4 w-4" />
                    <span>YouTube</span>
                    <Badge variant="outline" className="ml-1">
                      {stats.youtube}
                    </Badge>
                  </TabsTrigger>

                  <TabsTrigger
                    value="read"
                    className="flex items-center gap-1 data-[state=active]:bg-green-500 data-[state=active]:text-white"
                  >
                    <Eye className="h-4 w-4" />
                    <span>
                      {t("feeds.read") === "feeds.read"
                        ? "Okunmuş"
                        : t("feeds.read")}
                    </span>
                    <Badge variant="outline" className="ml-1">
                      {stats.total - stats.unread}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
                <ScrollBar orientation="horizontal" />
              </Tabs>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* İçerik */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
      <FeedGrid
            items={filteredItems}
        feeds={feeds}
        viewMode={viewMode}
        onToggleRead={handleToggleRead}
        onToggleFavorite={handleToggleFavorite}
        onToggleReadLater={handleToggleReadLater}
            isLoading={isLoading}
      />
        </motion.div>
      </AnimatePresence>

      {/* Diyaloglar */}
      <FilterDialog
        isOpen={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        filters={filters}
        onApplyFilters={applyFilters}
      />

      <KeyboardShortcutsDialog
        isOpen={shortcutsDialogOpen}
        onOpenChange={setShortcutsDialogOpen}
      />

      <AddFeedDialog
        isOpen={addFeedDialogOpen}
        onOpenChange={setAddFeedDialogOpen}
        onFeedAdded={refresh}
      />
    </FeedLayout>
  );
}
