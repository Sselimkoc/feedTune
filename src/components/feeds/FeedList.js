"use client";

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useFeeds,
  fetchFeeds,
  fetchFavorites,
  fetchReadLaterItems,
} from "@/hooks/useFeeds";
import { useFeedStore } from "@/store/useFeedStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";
import { FeedSkeleton } from "./FeedSkeleton";
import { FeedCard } from "./FeedCard";
import { FeedNavigation } from "./FeedNavigation";
import { EmptyFeedState } from "./EmptyFeedState";
import { EmptyFilterState } from "./EmptyFilterState";
import { AddFeedButton } from "./AddFeedButton";
import { FeedPagination } from "./FeedPagination";
import { Loader2, Filter } from "lucide-react";
import { FilterDialog } from "./FilterDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { useVirtualizer } from "@tanstack/react-virtual";

// Constants
const ITEMS_PER_PAGE = 10;

// Helper functions
const getPageCount = (totalItems, itemsPerPage) => {
  return Math.ceil(totalItems / itemsPerPage);
};

// Memoized FeedCard component
const MemoizedFeedCard = memo(FeedCard);

// Main component
export function FeedList() {
  // Hooks and stores
  const { user } = useAuthStore();
  const {
    feeds,
    items,
    isLoading,
    refetch,
    toggleItemRead,
    toggleItemFavorite,
    toggleItemReadLater,
    deleteFeed,
  } = useFeeds();
  const {
    showUnreadOnly,
    showFavoritesOnly,
    compactMode,
    selectedFeedIds,
    toggleFeedSelection,
    clearFeedSelection,
    filters,
    setFilters,
  } = useFeedStore();
  const { settings } = useSettingsStore();
  const queryClient = useQueryClient();

  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [focusedItemIndex, setFocusedItemIndex] = useState(0);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const itemRefs = useRef({});
  const containerRef = useRef(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // References
  const listRef = useRef(null);

  // Memoized values
  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    let result = [...items];

    // Feed ID'ye göre filtrele
    if (selectedFeedIds.length > 0) {
      result = result.filter((item) => selectedFeedIds.includes(item.feed_id));
    }

    // Feed türüne göre filtrele
    if (!filters.feedTypes.rss || !filters.feedTypes.youtube) {
      const feedTypeMap = feeds.reduce((acc, feed) => {
        acc[feed.id] = feed.type;
        return acc;
      }, {});

      result = result.filter((item) => {
        const feedType = feedTypeMap[item.feed_id];
        return (
          (feedType === "rss" && filters.feedTypes.rss) ||
          (feedType === "youtube" && filters.feedTypes.youtube)
        );
      });
    }

    // Okunma durumuna göre filtrele
    if (!filters.showRead && !filters.showUnread) {
      return []; // Hiçbir şey gösterme
    } else if (!filters.showRead) {
      result = result.filter((item) => !item.is_read);
    } else if (!filters.showUnread) {
      result = result.filter((item) => item.is_read);
    }

    // Favorilere göre filtrele
    if (filters.sortBy === "favorites") {
      result = result.filter((item) => item.is_favorite);
    }

    // Sıralama
    result.sort((a, b) => {
      if (filters.sortBy === "newest") {
        return new Date(b.published_at) - new Date(a.published_at);
      } else if (filters.sortBy === "oldest") {
        return new Date(a.published_at) - new Date(b.published_at);
      } else if (filters.sortBy === "unread") {
        // Okunmamışları önce göster
        if (a.is_read !== b.is_read) {
          return a.is_read ? 1 : -1;
        }
        // Aynı okunma durumundaysa en yenileri önce göster
        return new Date(b.published_at) - new Date(a.published_at);
      } else if (filters.sortBy === "favorites") {
        // Favorileri önce göster
        if (a.is_favorite !== b.is_favorite) {
          return a.is_favorite ? -1 : 1;
        }
        // Aynı favori durumundaysa en yenileri önce göster
        return new Date(b.published_at) - new Date(a.published_at);
      }
      return 0;
    });

    return result;
  }, [items, feeds, selectedFeedIds, filters]);

  // Pagination
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  // Virtualization
  const rowVirtualizer = useVirtualizer({
    count: paginatedItems.length,
    getScrollElement: () => listRef.current,
    estimateSize: useCallback(() => (compactMode ? 100 : 200), [compactMode]),
    overscan: 5,
  });

  // Memoized callbacks
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    setFocusedItemIndex(0);
    window.scrollTo(0, 0);
  }, []);

  const handleFilterChange = useCallback(
    (newFilters) => {
      setFilters(newFilters);
      setCurrentPage(1);
    },
    [setFilters]
  );

  const handleToggleRead = useCallback(
    (itemId) => {
      toggleItemRead(itemId);
    },
    [toggleItemRead]
  );

  const handleToggleFavorite = useCallback(
    (itemId) => {
      toggleItemFavorite(itemId);
    },
    [toggleItemFavorite]
  );

  const handleToggleReadLater = useCallback(
    (itemId) => {
      toggleItemReadLater(itemId);
    },
    [toggleItemReadLater]
  );

  const handleDeleteFeed = useCallback(
    (feedId) => {
      deleteFeed(feedId);
    },
    [deleteFeed]
  );

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  }, [currentPage, handlePageChange]);

  const handleNextPage = useCallback(() => {
    if (currentPage < getPageCount(filteredItems.length, ITEMS_PER_PAGE)) {
      handlePageChange(currentPage + 1);
    }
  }, [currentPage, filteredItems.length, handlePageChange]);

  // Feed selection handler
  const handleFeedSelect = useCallback(
    (feedId) => {
      if (feedId === null) {
        // null ise tüm seçimleri temizle
        clearFeedSelection();
      } else {
        // Değilse seçimi toggle et
        toggleFeedSelection(feedId);
      }
    },
    [toggleFeedSelection, clearFeedSelection]
  );

  // Load data when user changes
  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [user, refetch]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, selectedFeedIds]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Eğer bir input veya textarea odaklanmışsa, klavye kısayollarını devre dışı bırak
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

      // Yardım ekranı açıksa, sadece ESC tuşuna izin ver
      if (showKeyboardHelp) {
        if (e.key === "Escape") {
          setShowKeyboardHelp(false);
        }
        return;
      }

      switch (e.key) {
        case "?":
          e.preventDefault();
          setShowKeyboardHelp(true);
          break;
        case "j":
        case "ArrowDown":
          e.preventDefault();
          setFocusedItemIndex((prev) =>
            Math.min(prev + 1, paginatedItems.length - 1)
          );
          setIsNavigating(true);
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          setFocusedItemIndex((prev) => Math.max(prev - 1, 0));
          setIsNavigating(true);
          break;
        case "o":
        case "Enter":
          e.preventDefault();
          if (
            paginatedItems[focusedItemIndex] &&
            itemRefs.current[paginatedItems[focusedItemIndex].id]
          ) {
            itemRefs.current[paginatedItems[focusedItemIndex].id].click();
          }
          break;
        case "m":
          e.preventDefault();
          if (paginatedItems[focusedItemIndex]) {
            handleToggleRead(paginatedItems[focusedItemIndex].id);
          }
          break;
        case "s":
          e.preventDefault();
          if (paginatedItems[focusedItemIndex]) {
            handleToggleFavorite(paginatedItems[focusedItemIndex].id);
          }
          break;
        case "t":
          e.preventDefault();
          if (paginatedItems[focusedItemIndex]) {
            handleToggleReadLater(paginatedItems[focusedItemIndex].id);
          }
          break;
        case "PageDown":
          e.preventDefault();
          if (
            currentPage < getPageCount(filteredItems.length, ITEMS_PER_PAGE)
          ) {
            handlePageChange(currentPage + 1);
          }
          break;
        case "PageUp":
          e.preventDefault();
          if (currentPage > 1) {
            handlePageChange(currentPage - 1);
          }
          break;
        case "Home":
          e.preventDefault();
          setFocusedItemIndex(0);
          setIsNavigating(true);
          break;
        case "End":
          e.preventDefault();
          setFocusedItemIndex(paginatedItems.length - 1);
          setIsNavigating(true);
          break;
        case "Escape":
          e.preventDefault();
          handleFeedSelect(null);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    paginatedItems,
    focusedItemIndex,
    handleToggleRead,
    handleToggleFavorite,
    handleToggleReadLater,
    currentPage,
    filteredItems.length,
    handlePageChange,
    handleFeedSelect,
    showKeyboardHelp,
  ]);

  // Scroll to focused item
  useEffect(() => {
    if (
      isNavigating &&
      paginatedItems[focusedItemIndex] &&
      itemRefs.current[paginatedItems[focusedItemIndex].id]
    ) {
      itemRefs.current[paginatedItems[focusedItemIndex].id].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      setIsNavigating(false);
    }
  }, [focusedItemIndex, isNavigating, paginatedItems]);

  // Render
  if (isLoading) {
    return <FeedSkeleton />;
  }

  if (!feeds || feeds.length === 0) {
    return <EmptyFeedState />;
  }

  if (filteredItems.length === 0) {
    return <EmptyFilterState />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">
            {selectedFeedIds.length > 0
              ? feeds
                  .filter((f) => selectedFeedIds.includes(f.id))
                  .map((f) => f.title)
                  .join(", ")
              : "Beslemelerim"}
          </h1>
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setIsFilterDialogOpen(true)}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtrele</span>
            {Object.values(filters.feedTypes).some((v) => !v) && (
              <Badge variant="secondary" className="ml-1 px-1">
                {Object.values(filters.feedTypes).filter((v) => !v).length}
              </Badge>
            )}
          </Button>

          <Select
            value={filters.sortBy}
            onValueChange={(value) =>
              handleFilterChange({ ...filters, sortBy: value })
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Sırala" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">En Yeni</SelectItem>
              <SelectItem value="oldest">En Eski</SelectItem>
              <SelectItem value="unread">Okunmamış</SelectItem>
              <SelectItem value="favorites">Favoriler</SelectItem>
            </SelectContent>
          </Select>

          <AddFeedButton variant="default" size="sm" />
        </div>
      </div>

      <FeedNavigation
        feeds={feeds}
        selectedFeedIds={selectedFeedIds}
        onFeedSelect={handleFeedSelect}
        onDeleteFeed={handleDeleteFeed}
      />

      <FilterDialog
        open={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      <KeyboardShortcutsHelp
        open={showKeyboardHelp}
        onOpenChange={setShowKeyboardHelp}
      />

      <div className="mt-4">
        <div ref={listRef} className="overflow-auto">
          <div ref={containerRef} className="space-y-4">
            <AnimatePresence>
              {paginatedItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    duration: 0.2,
                    ease: "easeInOut",
                  }}
                  className="rounded-lg overflow-hidden"
                  ref={(el) => {
                    itemRefs.current[item.id] = el;
                  }}
                >
                  <MemoizedFeedCard
                    item={item}
                    feed={feeds.find((f) => f.id === item.feed_id)}
                    compact={compactMode}
                    onToggleRead={handleToggleRead}
                    onToggleFavorite={handleToggleFavorite}
                    onToggleReadLater={handleToggleReadLater}
                    isFocused={focusedItemIndex === index}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {getPageCount(filteredItems.length, ITEMS_PER_PAGE) > 1 && (
            <FeedPagination
              currentPage={currentPage}
              pageCount={getPageCount(filteredItems.length, ITEMS_PER_PAGE)}
              onPageChange={handlePageChange}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
