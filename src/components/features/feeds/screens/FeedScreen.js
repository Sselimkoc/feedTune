import { useState, useCallback, memo } from "react";
import { useFeedScreen } from "@/hooks/features/useFeedScreen";
import { FeedList } from "../layout/FeedList";
import { FeedFilters } from "../filters/FeedFilters";
import { Loader2, AlertCircle, RssIcon } from "lucide-react";
import { ContentCard } from "@/components/shared/ContentCard";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInView } from "react-intersection-observer";

// ContentCardSkeleton bileşeni - yükleme sırasında gösterilecek
const ContentCardSkeleton = memo(() => (
  <div className="rounded-xl overflow-hidden border-2 border-muted animate-pulse">
    <div className="aspect-video bg-muted"></div>
    <div className="p-4 space-y-3">
      <div className="h-5 bg-muted rounded w-3/4"></div>
      <div className="h-4 bg-muted rounded w-1/2"></div>
      <div className="h-10 bg-muted/50 rounded w-full mt-4"></div>
    </div>
  </div>
));
ContentCardSkeleton.displayName = "ContentCardSkeleton";

// FeedEmpty bileşeni - içerik olmadığında gösterilecek
const FeedEmpty = memo(({ onReset }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <RssIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
      <h3 className="text-xl font-semibold mb-2">{t("feeds.noItems")}</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        {t("feeds.noItemsDescription")}
      </p>
      {onReset && (
        <Button variant="outline" onClick={onReset}>
          {t("feeds.resetFilters")}
        </Button>
      )}
    </div>
  );
});
FeedEmpty.displayName = "FeedEmpty";

// FeedError bileşeni - hata durumunda gösterilecek
const FeedError = memo(({ error, onRetry }) => {
  const { t } = useLanguage();

  return (
    <Alert variant="destructive" className="mb-8">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{t("errors.loadFailed")}</AlertTitle>
      <AlertDescription>
        {error?.message || t("errors.genericError")}
      </AlertDescription>
      {onRetry && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onRetry}
          className="mt-2"
        >
          {t("common.retry")}
        </Button>
      )}
    </Alert>
  );
});
FeedError.displayName = "FeedError";

// MemoizedContentCard bileşeni - gereksiz render'ları engellemek için
const MemoizedContentCard = memo(ContentCard);

export function FeedScreen() {
  const { t } = useLanguage();
  const [viewAs, setViewAs] = useState("grid");
  const { ref: loadMoreRef, inView } = useInView();

  const {
    items,
    filters,
    isLoading,
    isLoadingMore,
    isInitialLoading,
    isError,
    error,
    refreshAll,
    pagination,
    loadMoreItems,
    toggleRead,
    toggleFavorite,
    toggleReadLater,
    applyFilters,
    resetFilters,
  } = useFeedScreen();

  // Otomatik yükleme için IntersectionObserver
  const handleInView = useCallback(async () => {
    if (inView && !isLoadingMore && pagination.hasMore) {
      await loadMoreItems();
    }
  }, [inView, isLoadingMore, pagination.hasMore, loadMoreItems]);

  // Görünüm InView olduğunda daha fazla içerik yükle
  useState(() => {
    handleInView();
  }, [handleInView]);

  // İçerik etkileşim işleyicileri
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

  // Manuel yenileme işleyicisi
  const handleRefresh = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);

  // Filtreleri resetleme işleyicisi
  const handleResetFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  // Yükleme durumunu render et
  if (isInitialLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <FeedFilters
            filters={filters}
            onFilterChange={() => {}}
            disabled={true}
            viewAs={viewAs}
            onViewChange={() => {}}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <ContentCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // Hata durumunu render et
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <FeedError error={error} onRetry={handleRefresh} />

        <div className="mb-6">
          <FeedFilters
            filters={filters}
            onFilterChange={applyFilters}
            viewAs={viewAs}
            onViewChange={setViewAs}
          />
        </div>

        <FeedEmpty onReset={handleResetFilters} />
      </div>
    );
  }

  // Boş içerik durumunu render et
  if (!isLoading && (!items || items.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <FeedFilters
            filters={filters}
            onFilterChange={applyFilters}
            viewAs={viewAs}
            onViewChange={setViewAs}
          />
        </div>

        <FeedEmpty onReset={handleResetFilters} />
      </div>
    );
  }

  // Ana içeriği render et
  return (
    <ScrollArea className="container mx-auto px-4 py-8">
      {/* Filtreler */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md pb-4 mb-6">
        <FeedFilters
          filters={filters}
          onFilterChange={applyFilters}
          viewAs={viewAs}
          onViewChange={setViewAs}
        />

        {/* Yükleme durumu göstergesi */}
        {isLoading && !isInitialLoading && (
          <div className="flex items-center justify-center w-full py-1 mt-2">
            <div className="bg-primary/10 text-primary text-xs px-4 py-1 rounded-full flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{t("feeds.refreshing")}</span>
            </div>
          </div>
        )}
      </div>

      {/* İçerik listesi */}
      <div
        className={`grid gap-6 ${
          viewAs === "grid"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1"
        }`}
      >
        {items.map((item) => (
          <MemoizedContentCard
            key={item.id}
            item={item}
            viewMode={viewAs}
            onRead={handleToggleRead}
            onFavorite={handleToggleFavorite}
            onReadLater={handleToggleReadLater}
          />
        ))}
      </div>

      {/* Daha fazla yükleme */}
      {pagination.hasMore && (
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {isLoadingMore ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-muted-foreground font-medium">
                {t("feeds.loadingMore")}
              </span>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={loadMoreItems}
              disabled={isLoadingMore}
            >
              {t("feeds.loadMore")}
            </Button>
          )}
        </div>
      )}

      {/* Sayfa sonu - tüm içerik yüklendiyse */}
      {!pagination.hasMore && items.length > 0 && (
        <div className="py-8 text-center text-muted-foreground border-t border-border mt-8">
          {t("feeds.endOfContent")}
        </div>
      )}
    </ScrollArea>
  );
}
