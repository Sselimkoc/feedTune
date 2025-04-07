"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FeedCard } from "./items/FeedCard";
import { FeedListItem } from "./items/FeedListItem";
import { EmptyFilterState } from "./EmptyFilterState";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useInView } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";

export function FeedGrid({
  items = [],
  isLoading = false,
  viewMode = "grid",
  onItemClick,
  onItemMarkRead,
  onItemMarkUnread,
  onItemFavorite,
  onItemReadLater,
  onItemShare,
  onRefresh,
  loadMoreItems,
  hasMoreItems = false,
  isLoadingMore = false,
  focusedItemId,
}) {
  const { t } = useLanguage();
  const [visibleItems, setVisibleItems] = useState(items);
  const loadMoreRef = useRef(null);
  const isLoadMoreVisible = useInView(loadMoreRef, {
    amount: 0.01, // Çok küçük bir kısmı görünse bile tetikle
    rootMargin: "800px 0px", // Görünüm alanını 800px aşağıya doğru genişlet
  });
  const focusedItemRef = useRef(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isLoadingInitiated, setIsLoadingInitiated] = useState(false);
  const [loadingAttemptCount, setLoadingAttemptCount] = useState(0);

  // DEBUG mesajı
  useEffect(() => {
    if (isLoadMoreVisible) {
      console.log("Load more bölgesi görünür durumda");
    }
  }, [isLoadMoreVisible]);

  // İçerik listesi değiştiğinde güncelle
  useEffect(() => {
    setVisibleItems(items);
    // İlk yüklemeden sonra loading durumunu false yap
    if (items.length > 0 && initialLoad) {
      setInitialLoad(false);
    }
  }, [items, initialLoad]);

  // Yeni içerik yükle - tamamen düzeltildi
  useEffect(() => {
    console.log(
      "Infinite scroll efekti tetiklendi, görünür:",
      isLoadMoreVisible
    );
    console.log("loadingMore:", isLoadingMore, "hasMoreItems:", hasMoreItems);

    // Yükleme fonksiyonu
    const handleLoadMore = async () => {
      if (!loadMoreItems || !hasMoreItems || isLoadingMore || isLoading) {
        console.log("Yükleme koşulları sağlanmıyor, atlanıyor");
        return;
      }

      // Yüklemeyi başlat
      setIsLoadingInitiated(true);
      console.log("Yükleme başlatılıyor...");

      try {
        // Yükleme fonksiyonunu çağır
        const result = await loadMoreItems();
        console.log("Yükleme sonucu:", result);

        // Deneme sayacını sıfırla, başarılı yükleme yapıldı
        if (result) {
          setLoadingAttemptCount(0);
        }
      } catch (error) {
        console.error("Daha fazla içerik yüklenirken hata:", error);
      } finally {
        console.log("Yükleme tamamlandı");
        // Yükleme tamamlandı
        setIsLoadingInitiated(false);
      }
    };

    // Tetikleme kontrolü: görünür ve yükleme başlamadı
    if (
      isLoadMoreVisible &&
      hasMoreItems &&
      !isLoadingMore &&
      !isLoading &&
      !isLoadingInitiated
    ) {
      console.log("Yükleme tetikleniyor");
      // Deneme sayısını artır
      setLoadingAttemptCount((prev) => prev + 1);

      // Hemen yükle
      handleLoadMore();
    }

    // Birkaç kez denedik ama hala daha fazla içerik var ve yüklenemiyor
    // Manuel buton ile yükleme seçeneği göster
    if (
      loadingAttemptCount > 3 &&
      hasMoreItems &&
      !isLoadingMore &&
      !isLoading
    ) {
      console.log("Manuel yükleme gösterilecek, otomatik yükleme çalışmadı");
    }
  }, [
    isLoadMoreVisible,
    hasMoreItems,
    isLoadingMore,
    isLoading,
    isLoadingInitiated,
    loadMoreItems,
    loadingAttemptCount,
  ]);

  // Odaklanılan içeriğe scroll
  useEffect(() => {
    if (focusedItemId && focusedItemRef.current) {
      focusedItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [focusedItemId]);

  // Referans alma yardımcı fonksiyonu
  const getItemRef = useCallback(
    (itemId) => {
      if (itemId === focusedItemId) {
        return focusedItemRef;
      }
      return null;
    },
    [focusedItemId]
  );

  // İçerik yoksa boş durumu göster
  if (!isLoading && items.length === 0) {
    return <EmptyFilterState onRefresh={onRefresh} />;
  }

  // Manuel yükleme işleyicisi
  const handleManualLoadMore = () => {
    if (loadMoreItems && hasMoreItems && !isLoadingMore) {
      loadMoreItems();
    }
  };

  // İskelet yükleyici oluşturma - optimize edildi
  const renderSkeletons = useCallback(() => {
    const skeletonCount = viewMode === "grid" ? 12 : 8;
    const skeletons = [];

    for (let i = 0; i < skeletonCount; i++) {
      if (viewMode === "grid") {
        skeletons.push(
          <div key={`skeleton-${i}`} className="h-full">
            <Skeleton className="h-40 w-full rounded-t-lg" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-3 w-20" />
                <div className="flex space-x-1">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        );
      } else {
        skeletons.push(
          <div key={`skeleton-${i}`} className="p-4 border-b">
            <div className="flex space-x-4">
              <Skeleton className="h-16 w-16 rounded flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <div className="flex space-x-1">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
    }

    return skeletons;
  }, [viewMode]);

  return (
    <>
      <motion.div
        layout
        className={cn("w-full", {
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5":
            viewMode === "grid",
          "flex flex-col space-y-2": viewMode === "list",
        })}
      >
        <AnimatePresence mode="popLayout">
          {isLoading && initialLoad
            ? renderSkeletons()
            : visibleItems.map((item) => {
                const isRead = item.isRead || item.is_read || false;
                const isFavorite = item.isFavorite || item.is_favorite || false;
                const isReadLater =
                  item.isReadLater || item.is_read_later || false;
                const isFocused = focusedItemId === item.id;

                // Feed bilgilerini standardize et
                const feedTitle =
                  item.feedTitle ||
                  item.feed_title ||
                  (item.feed ? item.feed.title : "") ||
                  "";
                const feedType =
                  item.type ||
                  item.feed_type ||
                  (item.feed ? item.feed.type : "") ||
                  "rss";

                // item nesnesini zenginleştir
                const enhancedItem = {
                  ...item,
                  isRead,
                  is_read: isRead,
                  isFavorite,
                  is_favorite: isFavorite,
                  isReadLater,
                  is_read_later: isReadLater,
                  feedTitle,
                  feed_title: feedTitle,
                  type: feedType,
                  feed_type: feedType,
                };

                return viewMode === "grid" ? (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    ref={getItemRef(item.id)}
                    className={cn("h-full", {
                      "ring-2 ring-primary ring-offset-2": isFocused,
                    })}
                  >
                    <FeedCard
                      item={enhancedItem}
                      isRead={isRead}
                      isFavorite={isFavorite}
                      isReadLater={isReadLater}
                      onClick={() => onItemClick && onItemClick(enhancedItem)}
                      onMarkRead={() =>
                        onItemMarkRead && onItemMarkRead(enhancedItem)
                      }
                      onMarkUnread={() =>
                        onItemMarkUnread && onItemMarkUnread(enhancedItem)
                      }
                      onFavorite={() =>
                        onItemFavorite && onItemFavorite(enhancedItem)
                      }
                      onReadLater={() =>
                        onItemReadLater && onItemReadLater(enhancedItem)
                      }
                      onShare={() => onItemShare && onItemShare(enhancedItem)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    ref={getItemRef(item.id)}
                    className={cn("w-full", {
                      "ring-1 ring-primary bg-accent": isFocused,
                    })}
                  >
                    <FeedListItem
                      item={enhancedItem}
                      isRead={isRead}
                      isFavorite={isFavorite}
                      isReadLater={isReadLater}
                      onClick={() => onItemClick && onItemClick(enhancedItem)}
                      onMarkRead={() =>
                        onItemMarkRead && onItemMarkRead(enhancedItem)
                      }
                      onMarkUnread={() =>
                        onItemMarkUnread && onItemMarkUnread(enhancedItem)
                      }
                      onFavorite={() =>
                        onItemFavorite && onItemFavorite(enhancedItem)
                      }
                      onReadLater={() =>
                        onItemReadLater && onItemReadLater(enhancedItem)
                      }
                      onShare={() => onItemShare && onItemShare(enhancedItem)}
                    />
                  </motion.div>
                );
              })}
        </AnimatePresence>
      </motion.div>

      {/* Daha fazla yükleme göstergesi - tamamen yeniden tasarlandı */}
      <div
        ref={loadMoreRef}
        className="w-full flex justify-center items-center py-6 mt-4"
      >
        {isLoadingMore ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="relative w-8 h-8">
              <div className="absolute top-0 left-0 w-full h-full border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("feeds.loadingMore") || "Daha fazla yükleniyor..."}
            </p>
          </div>
        ) : hasMoreItems ? (
          <>
            {/* Otomatik yükleme mesajı */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              className="flex flex-col items-center"
            >
              <p className="text-sm text-muted-foreground mb-2">
                {t("feeds.autoLoading") || "Otomatik yükleniyor..."}
              </p>

              {/* Manuel yükleme butonu (3 denemeden sonra göster) */}
              {loadingAttemptCount > 3 && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="px-4 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-sm mt-2 transition-colors"
                  onClick={handleManualLoadMore}
                >
                  {t("feeds.loadMoreManually") || "Daha Fazla Göster"}
                </motion.button>
              )}
            </motion.div>
          </>
        ) : items.length > 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground py-2"
          >
            {t("feeds.noMoreItems") || "Tüm içerikler yüklendi"}
          </motion.p>
        ) : null}
      </div>
    </>
  );
}
