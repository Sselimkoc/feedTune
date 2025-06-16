"use client";

import { useState, memo, useCallback, useEffect, useMemo } from "react";
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
  BookCheck,
  Star,
  Bookmark,
  CheckSquare,
  Plus,
  Loader2,
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
import { useFeedService } from "@/hooks/features/useFeedService";
import { useEnhancedFeed } from "@/hooks/useEnhancedFeed";
import { ContentList } from "@/components/shared/ContentList";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { ContentCard } from "@/components/shared/ContentCard";
import { LoadingState } from "@/components/ui-states/LoadingState";
import { ErrorState } from "@/components/ui-states/ErrorState";
import { EmptyState } from "@/components/ui-states/EmptyState";

/**
 * FeedContainer Component
 * Main container for displaying feed content with sidebar, toolbar, and content list
 */
export const FeedContainer = memo(function FeedContainer({
  initialFeedId,
  headerIcon,
}) {
  const { t } = useTranslation();
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
    bulkActions,
    markAsRead,
    markAsUnread,
  } = useFeedScreen({ initialFeedId });

  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showAddFeedDialog, setShowAddFeedDialog] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);

  const { isRefreshing, refreshFeed: enhancedRefreshFeed } = useEnhancedFeed();

  // Effect to filter items based on search query
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

  // UseEffect to render items even if loading state gets stuck
  useEffect(() => {
    if (isLoading && items && items.length > 0) {
      console.log("Force rendering items despite loading state:", items.length);
    }
  }, [isLoading, items]);

  // Items are available but still in loading state - apply a forceful fix
  const shouldForceRenderItems =
    items && items.length > 0 && isLoading && !isTransitioning;

  // Event handlers
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

  const handleLoadMore = useCallback(async () => {
    await loadMoreItems();
  }, [loadMoreItems]);

  const handleItemClick = useCallback(
    async (url, item) => {
      if (url) {
        window.open(url, "_blank");
        if (item && !item.is_read) {
          try {
            await toggleRead(item.id, true);
          } catch (error) {
            console.error("Content could not be marked as read:", error);
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

  const renderBulkActionBar = useCallback(() => {
    if (!bulkActions?.isBulkSelectionMode || !bulkActions.selectedCount)
      return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="sticky bottom-4 left-0 right-0 z-10 mx-auto max-w-3xl bg-primary text-primary-foreground rounded-lg shadow-lg flex items-center justify-between px-4 py-2"
      >
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-2 py-1">
            {bulkActions.selectedCount} {t("feeds.selected")}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => bulkActions.toggleSelectAll(items)}
            className="text-primary-foreground hover:text-primary-foreground/90 hover:bg-primary-foreground/10"
          >
            {bulkActions.selectedCount === items.length
              ? t("feeds.deselectAll")
              : t("feeds.selectAll")}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => bulkActions.markSelectedAsRead()}
            className="text-primary-foreground hover:text-primary-foreground/90 hover:bg-primary-foreground/10"
          >
            <BookCheck className="mr-2 h-4 w-4" />
            {t("feeds.markAsRead")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => bulkActions.toggleSelectedFavorite(true)}
            className="text-primary-foreground hover:text-primary-foreground/90 hover:bg-primary-foreground/10"
          >
            <Star className="mr-2 h-4 w-4" />
            {t("feeds.addToFavorites")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => bulkActions.toggleSelectedReadLater(true)}
            className="text-primary-foreground hover:text-primary-foreground/90 hover:bg-primary-foreground/10"
          >
            <Bookmark className="mr-2 h-4 w-4" />
            {t("feeds.addToReadLater")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => bulkActions.toggleBulkSelectionMode()}
            className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
          >
            {t("feeds.cancel")}
          </Button>
        </div>
      </motion.div>
    );
  }, [bulkActions, items, t]);

  const renderBulkSelectionButton = useCallback(() => {
    if (isLoading || items.length === 0 || !bulkActions) return null;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={bulkActions.toggleBulkSelectionMode}
            aria-label={t("feeds.bulkActions")}
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{t("feeds.bulkActions")}</TooltipContent>
      </Tooltip>
    );
  }, [bulkActions, isLoading, items.length, t]);

  const extraButtons = useMemo(() => {
    const buttons = [];

    buttons.push(
      <Tooltip key="search">
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={handleToggleSearch}
            aria-label={t("feeds.search")}
          >
            <Search className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{t("feeds.search")}</TooltipContent>
      </Tooltip>
    );

    // Add bulk selection button
    const bulkSelectionButton = renderBulkSelectionButton();
    if (bulkSelectionButton) {
      buttons.push(bulkSelectionButton);
    }

    // Add Feed Button
    buttons.push(
      <Tooltip key="add-feed">
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={handleAddFeed}
            aria-label={t("feeds.addNewFeed")}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{t("feeds.addNewFeed")}</TooltipContent>
      </Tooltip>
    );

    return buttons;
  }, [handleAddFeed, handleToggleSearch, renderBulkSelectionButton, t]);

  // Feed header icon logic
  const feedHeaderIcon =
    headerIcon ||
    (selectedFeed ? (
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
    ));

  const feedTitle = selectedFeed ? selectedFeed.title : t("feeds.allFeeds");
  const feedDescription = selectedFeed
    ? selectedFeed.description || t("feeds.noDescription")
    : t("feeds.allFeedsDescription");

  const customContent = useMemo(
    () => (
      <div className="flex-1 min-w-0">
        {isLoadingMore && (
          <div className="flex justify-center mb-4">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("feeds.loadingMore")}
            </span>
          </div>
        )}

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

        <ContentList
          items={filteredItems}
          viewMode={viewMode}
          cardType="feed"
          isLoading={isLoading || isTransitioning}
          isError={isError}
          error={error}
          onRetry={refreshAll}
          onToggleFavorite={toggleFavorite}
          onToggleReadLater={toggleReadLater}
          onItemClick={handleItemClick}
          bulkActions={bulkActions}
          selectable={bulkActions?.isBulkSelectionMode}
          onLoadMore={handleLoadMore}
          onMarkAsRead={markAsRead}
          onMarkAsUnread={markAsUnread}
        />

        {!isLoading &&
          !isLoadingMore &&
          filteredItems.length > 0 &&
          pagination?.hasMore && (
            <div className="flex justify-center mt-8 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="gap-2"
              >
                {isLoadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {t("feeds.loadMore")}
              </Button>
            </div>
          )}

        <AnimatePresence>{renderBulkActionBar()}</AnimatePresence>
      </div>
    ),
    [
      bulkActions,
      error,
      filteredItems,
      handleItemClick,
      isError,
      isLoading,
      isLoadingMore,
      isTransitioning,
      handleLoadMore,
      pagination?.hasMore,
      refreshAll,
      renderBulkActionBar,
      searchQuery,
      t,
      toggleFavorite,
      toggleReadLater,
      viewMode,
      markAsRead,
      markAsUnread,
    ]
  );

  if (!feeds || feeds.length === 0) {
    return (
      <TooltipProvider>
        <ContentContainer
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onRefresh={refreshAll}
          headerIcon={headerIcon || <Rss className="h-6 w-6 text-primary" />}
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
            <>
              <AddFeedDialog
                open={showAddFeedDialog}
                onOpenChange={setShowAddFeedDialog}
                onFeedAdded={refreshAll}
              />
              <KeyboardShortcutsDialog
                isOpen={showKeyboardShortcuts}
                onOpenChange={handleKeyboardShortcutsChange}
              />
            </>
          }
        >
          {isLoading ? (
            <LoadingState
              title={t("feeds.loading")}
              description={t("feeds.loadingDescription")}
            />
          ) : isError ? (
            <ErrorState
              title={t("errors.somethingWentWrong")}
              description={t("errors.tryAgain")}
            />
          ) : !items?.length ? (
            <EmptyState
              title={t("feeds.emptyTitle")}
              description={t("feeds.emptyDescription")}
            />
          ) : (
            customContent
          )}
        </ContentContainer>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="feed-container w-full h-full relative">
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
              <KeyboardShortcutsDialog
                isOpen={showKeyboardShortcuts}
                onOpenChange={handleKeyboardShortcutsChange}
              />
            </>
          }
        >
          {customContent}
        </ContentContainer>
      </div>
    </TooltipProvider>
  );
});

// Set default props
FeedContainer.defaultProps = {
  initialFeedId: null,
  headerIcon: null,
};
