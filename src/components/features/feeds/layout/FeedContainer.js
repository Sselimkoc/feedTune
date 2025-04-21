"use client";

import { useState, memo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFeedScreen } from "@/hooks/features/useFeedScreen";
import { ContentContainer } from "@/components/shared/ContentContainer";
import { FeedSidebar } from "@/components/features/feeds/layout/FeedSidebar";
import { KeyboardShortcutsDialog } from "@/components/features/feeds/dialogs/KeyboardShortcutsDialog";
import { FilterDialog } from "@/components/features/feeds/dialogs/FilterDialog";
import { AddFeedDialog } from "@/components/features/feeds/dialogs/AddFeedDialog";
import { useLanguage } from "@/hooks/useLanguage";
import { FilterButton } from "@/components/features/feeds/buttons/FilterButton";
import { AddFeedButton } from "@/components/features/feeds/buttons/AddFeedButton";
import {
  Rss,
  Youtube,
  ExternalLink,
  ListFilter,
  Search,
  RefreshCw,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FeedItem } from "@/components/features/feeds/layout/FeedItem";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatRelativeTime } from "@/utils/dateUtils";
import { FeedService } from "@/services/feedService";
import { useFeedService } from "@/hooks/useFeedService";
import { useEnhancedFeed } from "@/hooks/useEnhancedFeed";

export const FeedContainer = memo(function FeedContainer() {
  const { t } = useLanguage();
  const {
    feeds,
    items,
    selectedFeed,
    viewMode,
    filters,
    stats,
    isLoading,
    isLoadingMore,
    isInitialLoading,
    isTransitioning,
    isError,
    error,
    setActiveFilter,
    setViewMode,
    applyFilters,
    resetFilters,
    toggleRead,
    toggleFavorite,
    toggleReadLater,
    shareItem,
    refreshAll,
    loadMoreItems,
    pagination,
  } = useFeedScreen();

  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showAddFeedDialog, setShowAddFeedDialog] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);

  const { isRefreshing, refreshFeed: enhancedRefreshFeed } = useEnhancedFeed();

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = items.filter(
      (item) =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.feed_title?.toLowerCase().includes(query)
    );
    setFilteredItems(filtered);
  }, [items, searchQuery]);

  const handleShowKeyboardShortcuts = useCallback(() => {
    setShowKeyboardShortcuts(true);
  }, []);

  const handleKeyboardShortcutsChange = useCallback((isOpen) => {
    setShowKeyboardShortcuts(isOpen);
  }, []);

  const handleViewModeChange = useCallback(
    (mode) => {
      setViewMode(mode);
    },
    [setViewMode]
  );

  const handleOpenFilters = useCallback(() => {
    setShowFilterDialog(true);
  }, []);

  const handleAddFeed = useCallback(() => {
    setShowAddFeedDialog(true);
  }, []);

  const handleToggleSearch = useCallback(() => {
    setShowSearch((prev) => !prev);
    if (showSearch) {
      setSearchQuery("");
    }
  }, [showSearch]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && pagination.hasMore) {
      loadMoreItems();
    }
  }, [isLoadingMore, pagination.hasMore, loadMoreItems]);

  const handleItemClick = useCallback(
    async (url, item) => {
      if (url) {
        window.open(url, "_blank");
        if (item && !item.is_read) {
          try {
            await toggleRead(item.id, true);
          } catch (error) {
            console.error("İçerik okundu işaretlenemedi:", error);
          }
        }
      }
    },
    [toggleRead]
  );

  const handleToggleRead = useCallback(
    async (itemId, isRead) => {
      try {
        await toggleRead(itemId, isRead);
      } catch (error) {
        console.error("Toggle read error:", error);
      }
    },
    [toggleRead]
  );

  const handleRefresh = async () => {
    try {
      if (!selectedFeed) {
        toast.error(t("feeds.noFeedSelected"));
        return;
      }

      if (selectedFeed.url.includes("hurriyet.com.tr")) {
        toast.loading(t("feeds.refreshingHurriyetFeed"));
        await enhancedRefreshFeed(selectedFeed.id, true);
      } else {
        toast.loading(t("feeds.refreshingSelectedFeed"));
        await enhancedRefreshFeed(selectedFeed.id);
      }

      toast.success(t("feeds.refreshSuccess"));
    } catch (error) {
      console.error("Feed refresh error:", error);
      toast.error(
        selectedFeed.url.includes("hurriyet.com.tr")
          ? t("feeds.tryRefreshHurriyetWithoutCache")
          : t("feeds.refreshError")
      );
    }
  };

  const extraButtons = (
    <>
      {selectedFeed && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing
              ? selectedFeed.url.includes("hurriyet.com.tr")
                ? t("feeds.refreshingFeedWithoutCache")
                : t("feeds.refreshingFeed")
              : selectedFeed.url.includes("hurriyet.com.tr")
              ? t("feeds.refreshFeedWithoutCache")
              : t("feeds.refreshFeed")}
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full"
        onClick={handleToggleSearch}
        aria-label={t("common.search")}
      >
        <Search className="h-4 w-4" />
      </Button>
      <AddFeedButton onAddFeed={handleAddFeed} />
      <FilterButton onOpenFilters={handleOpenFilters} />
    </>
  );

  const feedHeaderIcon = selectedFeed ? (
    <div className="w-6 h-6 flex-shrink-0">
      {selectedFeed.icon ? (
        <img
          src={selectedFeed.icon}
          alt=""
          className="w-full h-full object-contain rounded-sm"
        />
      ) : selectedFeed.type === "youtube" ? (
        <Youtube className="w-full h-full text-red-500" />
      ) : (
        <Rss className="w-full h-full text-primary" />
      )}
    </div>
  ) : (
    <Rss className="h-6 w-6 text-primary" />
  );

  const feedTitle = selectedFeed ? selectedFeed.title : t("feeds.allFeeds");
  const feedDescription = selectedFeed
    ? selectedFeed.description || t("feeds.noDescription")
    : t("feeds.allFeedsDescription");

  const customContent = (
    <div className="flex-1 min-w-0">
      <AnimatePresence mode="wait">
        {showSearch && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mb-4"
          >
            <div className="relative">
              <Input
                type="text"
                placeholder={t("common.searchItems")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full"
                  onClick={() => setSearchQuery("")}
                >
                  <span className="sr-only">{t("common.clear")}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {isInitialLoading ? (
          <div
            className={`grid grid-cols-1 ${
              viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : ""
            } gap-4`}
          >
            {Array(6)
              .fill(0)
              .map((_, index) => (
                <div
                  key={`skeleton-${index}-${Date.now()}`}
                  className="flex flex-col border rounded-lg overflow-hidden"
                >
                  <Skeleton className="h-40 w-full rounded-none" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
          </div>
        ) : isError ? (
          <div className="bg-destructive/10 border-destructive/30 border rounded-lg p-6 flex flex-col items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="42"
              height="42"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-destructive mb-4"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h3 className="text-lg font-medium mb-2">{t("common.error")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error?.message || t("common.errorOccurred")}
            </p>
            <Button onClick={refreshAll} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {t("common.retry")}
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center border rounded-lg bg-muted/30">
            {searchQuery ? (
              <>
                <Search className="h-10 w-10 text-muted-foreground opacity-30 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {t("search.noResults")}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mb-4">
                  {t("search.tryDifferentTerms")}
                </p>
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  {t("search.clearSearch")}
                </Button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Rss className="h-7 w-7 text-muted-foreground opacity-40" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {t("feeds.noItems")}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mb-4">
                  {t("feeds.noItemsDescription")}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    onClick={refreshAll}
                    variant="outline"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t("common.refresh")}
                  </Button>
                  <Button
                    onClick={handleAddFeed}
                    variant="default"
                    className="gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="M12 5v14" />
                    </svg>
                    {t("feeds.addFeed.title")}
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {searchQuery && (
              <div className="mb-4 flex items-center justify-between">
                <Badge variant="outline" className="px-3 py-1 text-sm gap-2">
                  <Search className="h-3 w-3" />
                  {t("search.resultsFor")} "{searchQuery}"
                </Badge>
                <Badge variant="secondary">
                  {filteredItems.length} {t("search.results")}
                </Badge>
              </div>
            )}
            <div
              className={`grid grid-cols-1 ${
                viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : ""
              } gap-4`}
            >
              <AnimatePresence mode="sync">
                {filteredItems.map((item) => (
                  <FeedItem
                    key={item.id}
                    item={item}
                    viewMode={viewMode}
                    onClick={handleItemClick}
                    onFavorite={toggleFavorite}
                    onReadLater={toggleReadLater}
                    onShare={shareItem}
                    onToggleRead={handleToggleRead}
                  />
                ))}
              </AnimatePresence>
            </div>

            {pagination?.hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  variant="outline"
                  className="px-8"
                >
                  {isLoadingMore ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-muted-foreground"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {t("common.loading")}
                    </>
                  ) : (
                    t("feeds.loadMore")
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  if (!feeds || feeds.length === 0) {
    return (
      <ContentContainer
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onRefresh={refreshAll}
        headerIcon={<Rss className="h-6 w-6 text-primary" />}
        headerTitle={t("feeds.title")}
        headerDescription={t("feeds.description")}
        items={[]}
        isLoading={isLoading}
        isError={isError}
        error={error}
        cardType="feed"
        emptyIcon={<Rss className="h-10 w-10 opacity-20" />}
        emptyTitle={t("feeds.emptyTitle")}
        emptyDescription={t("feeds.emptyDescription")}
        onToggleFavorite={toggleFavorite}
        onToggleReadLater={toggleReadLater}
        extraHeaderButtons={extraButtons}
        extraDialogs={
          <AddFeedDialog
            open={showAddFeedDialog}
            onOpenChange={setShowAddFeedDialog}
            onFeedAdded={refreshAll}
          />
        }
      />
    );
  }

  return (
    <ContentContainer
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
      onRefresh={refreshAll}
      headerIcon={feedHeaderIcon}
      headerTitle={feedTitle}
      headerDescription={feedDescription}
      isLoading={isLoading || isTransitioning}
      isError={isError}
      error={error}
      showKeyboardShortcuts={showKeyboardShortcuts}
      onShowKeyboardShortcuts={handleShowKeyboardShortcuts}
      onKeyboardShortcutsChange={handleKeyboardShortcutsChange}
      extraHeaderButtons={extraButtons}
      sidebarContent={
        <FeedSidebar
          feeds={feeds}
          selectedFeed={selectedFeed}
          onFeedSelect={setActiveFilter}
          stats={stats}
        />
      }
      extraDialogs={
        <>
          <FilterDialog
            open={showFilterDialog}
            onOpenChange={setShowFilterDialog}
            onApplyFilters={applyFilters}
            onResetFilters={resetFilters}
            activeFilter={selectedFeed?.id}
            filters={filters}
          />
          <AddFeedDialog
            open={showAddFeedDialog}
            onOpenChange={setShowAddFeedDialog}
            onFeedAdded={refreshAll}
          />
        </>
      }
    >
      {customContent}
    </ContentContainer>
  );
});
