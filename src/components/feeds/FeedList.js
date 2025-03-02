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

// Constants
const ITEMS_PER_PAGE = 10;

// Helper functions
const getPageCount = (totalItems, itemsPerPage) => {
  return Math.ceil(totalItems / itemsPerPage);
};

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
    selectedFeedId,
    setSelectedFeedId,
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
  const selectedItemRef = useRef(null);

  // Memoized values
  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    let result = [...items];

    // Feed ID'ye göre filtrele
    if (selectedFeedId) {
      result = result.filter((item) => item.feed_id === selectedFeedId);
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

    // Sıralama
    switch (filters.sortBy) {
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.published_at).getTime() -
            new Date(b.published_at).getTime()
        );
        break;
      case "unread":
        result.sort((a, b) => {
          if (a.is_read === b.is_read) {
            return (
              new Date(b.published_at).getTime() -
              new Date(a.published_at).getTime()
            );
          }
          return a.is_read ? 1 : -1;
        });
        break;
      case "favorites":
        result.sort((a, b) => {
          if (a.is_favorite === b.is_favorite) {
            return (
              new Date(b.published_at).getTime() -
              new Date(a.published_at).getTime()
            );
          }
          return a.is_favorite ? -1 : 1;
        });
        break;
      case "newest":
      default:
        result.sort(
          (a, b) =>
            new Date(b.published_at).getTime() -
            new Date(a.published_at).getTime()
        );
        break;
    }

    return result;
  }, [items, feeds, selectedFeedId, filters]);

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage]);

  const pageCount = useMemo(() => {
    return getPageCount(filteredItems.length, ITEMS_PER_PAGE);
  }, [filteredItems]);

  // Load data when user changes
  useEffect(() => {
    if (user) {
      refetch();
      queryClient.prefetchQuery(["feeds", user.id], fetchFeeds);
      queryClient.prefetchQuery(["favorites", user.id], fetchFavorites);
      queryClient.prefetchQuery(["read-later", user.id], fetchReadLaterItems);
    }
  }, [user, refetch, queryClient]);

  // Reset selected item when page changes
  useEffect(() => {
    setFocusedItemIndex(0);
  }, [currentPage, selectedFeedId]);

  // Keyboard navigation
  useEffect(() => {
    if (!settings.enableKeyboardNavigation) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedItemIndex((prev) =>
            Math.min(prev + 1, filteredItems.length - 1)
          );
          setIsNavigating(true);
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedItemIndex((prev) => Math.max(prev - 1, 0));
          setIsNavigating(true);
          break;
        case "Enter":
          e.preventDefault();
          if (filteredItems[focusedItemIndex]) {
            const item = filteredItems[focusedItemIndex];
            window.open(item.link, "_blank");
            toggleItemRead(item.id, true);
          }
          break;
        case "r":
          e.preventDefault();
          if (filteredItems[focusedItemIndex]) {
            const item = filteredItems[focusedItemIndex];
            toggleItemRead(item.id, !item.is_read);
          }
          break;
        case "f":
          e.preventDefault();
          if (filteredItems[focusedItemIndex]) {
            const item = filteredItems[focusedItemIndex];
            toggleItemFavorite(item.id, !item.is_favorite);
          }
          break;
        case "?":
          e.preventDefault();
          setShowKeyboardHelp((prev) => !prev);
          break;
        case "Escape":
          e.preventDefault();
          if (showKeyboardHelp) {
            setShowKeyboardHelp(false);
          }
          break;
        case "c":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            refetch();
          }
          break;
        case "PageDown":
          e.preventDefault();
          if (currentPage < pageCount) {
            setCurrentPage(currentPage + 1);
          }
          break;
        case "PageUp":
          e.preventDefault();
          if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
          break;
        case "Home":
          e.preventDefault();
          setFocusedItemIndex(0);
          setIsNavigating(true);
          break;
        case "End":
          e.preventDefault();
          setFocusedItemIndex(filteredItems.length - 1);
          setIsNavigating(true);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    settings.enableKeyboardNavigation,
    filteredItems,
    focusedItemIndex,
    toggleItemRead,
    toggleItemFavorite,
    showKeyboardHelp,
    refetch,
    currentPage,
    pageCount,
  ]);

  // Scroll to selected item
  useEffect(() => {
    if (isNavigating && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      setIsNavigating(false);
    }
  }, [focusedItemIndex, isNavigating]);

  // Page change handlers
  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < pageCount) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, pageCount]);

  // Feed selection handler
  const handleFeedSelect = useCallback(
    (feedId) => {
      setSelectedFeedId(feedId === selectedFeedId ? null : feedId);
      setCurrentPage(1);
    },
    [selectedFeedId, setSelectedFeedId]
  );

  // Memoized item action handlers
  const handleToggleRead = useCallback(
    (itemId, isRead) => {
      console.log("Toggling read status:", itemId, isRead);
      if (typeof toggleItemRead === "function") {
        toggleItemRead({ itemId, isRead });
      } else {
        console.error("toggleItemRead is not a function");
      }
    },
    [toggleItemRead]
  );

  const handleToggleFavorite = useCallback(
    (itemId, isFavorite) => {
      console.log("Toggling favorite status:", itemId, isFavorite);
      if (typeof toggleItemFavorite === "function") {
        toggleItemFavorite({ itemId, isFavorite });
      } else {
        console.error("toggleItemFavorite is not a function");
      }
    },
    [toggleItemFavorite]
  );

  const handleToggleReadLater = useCallback(
    (itemId, isReadLater) => {
      console.log("FeedList: Toggling read later status:", itemId, isReadLater);

      // Optimistic update
      queryClient.setQueryData(["feeds"], (old) => {
        if (!old) return { feeds: [], items: [] };

        return {
          ...old,
          items: old.items.map((item) =>
            item.id === itemId ? { ...item, is_read_later: isReadLater } : item
          ),
        };
      });

      if (typeof toggleItemReadLater === "function") {
        console.log("toggleItemReadLater function exists, calling it now");
        try {
          toggleItemReadLater({ itemId, isReadLater });
        } catch (error) {
          console.error("Error calling toggleItemReadLater:", error);

          // Fallback to direct database update
          try {
            const supabase = createClientComponentClient();
            supabase
              .from("feed_items")
              .update({ is_read_later: isReadLater })
              .eq("id", itemId)
              .then(({ error: updateError }) => {
                if (updateError) {
                  console.error("Error in fallback update:", updateError);
                  // Rollback optimistic update
                  queryClient.setQueryData(["feeds"], (old) => {
                    if (!old) return { feeds: [], items: [] };

                    return {
                      ...old,
                      items: old.items.map((item) =>
                        item.id === itemId
                          ? { ...item, is_read_later: !isReadLater }
                          : item
                      ),
                    };
                  });
                } else {
                  console.log(
                    "Successfully updated read later status directly"
                  );
                }
              });
          } catch (fallbackError) {
            console.error("Error in fallback update:", fallbackError);
          }
        }
      } else {
        console.error(
          "toggleItemReadLater is not a function",
          toggleItemReadLater
        );

        // Direct database update
        try {
          const supabase = createClientComponentClient();
          supabase
            .from("feed_items")
            .update({ is_read_later: isReadLater })
            .eq("id", itemId)
            .then(({ error: updateError }) => {
              if (updateError) {
                console.error("Error updating directly:", updateError);
                // Rollback optimistic update
                queryClient.setQueryData(["feeds"], (old) => {
                  if (!old) return { feeds: [], items: [] };

                  return {
                    ...old,
                    items: old.items.map((item) =>
                      item.id === itemId
                        ? { ...item, is_read_later: !isReadLater }
                        : item
                    ),
                  };
                });
              } else {
                console.log("Successfully updated read later status directly");
              }
            });
        } catch (directError) {
          console.error("Error in direct update:", directError);
        }
      }
    },
    [toggleItemReadLater, queryClient]
  );

  const handleOpenLink = useCallback(
    (link, itemId) => {
      if (!link) {
        console.error("No link provided");
        return;
      }
      window.open(link, "_blank");
      // Automatically mark as read when opened
      if (itemId && typeof toggleItemRead === "function") {
        toggleItemRead({ itemId, isRead: true });
      }
    },
    [toggleItemRead]
  );

  // Aktif filtre sayısını hesapla
  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (filters.sortBy !== "newest") count++;
    if (!filters.showRead) count++;
    if (!filters.showUnread) count++;
    if (!filters.feedTypes.rss) count++;
    if (!filters.feedTypes.youtube) count++;

    return count;
  }, [filters]);

  // Render
  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showKeyboardHelp && (
          <KeyboardShortcutsHelp onClose={() => setShowKeyboardHelp(false)} />
        )}
      </AnimatePresence>

      {/* Feed Navigation */}
      {feeds.length > 0 && (
        <FeedNavigation
          feeds={feeds}
          selectedFeedId={selectedFeedId}
          onFeedSelect={setSelectedFeedId}
          onOpenFilters={() => setIsFilterDialogOpen(true)}
        />
      )}

      {/* Filter Button (Mobile) */}
      <div className="flex justify-between items-center mb-4 lg:hidden">
        <h2 className="text-xl font-semibold">
          {selectedFeedId
            ? feeds.find((f) => f.id === selectedFeedId)?.title || "Feed"
            : "Tüm Beslemeler"}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFilterDialogOpen(true)}
          className="h-8 rounded-full"
        >
          <Filter className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs">Filtrele</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filter Dialog */}
      <FilterDialog
        isOpen={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        filters={filters}
        onApplyFilters={setFilters}
      />

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : feeds.length === 0 ? (
        // Empty State - No Feeds
        <div className="space-y-6">
          <EmptyFeedState />
          <AddFeedButton />
        </div>
      ) : filteredItems.length === 0 ? (
        // Empty State - No Items Match Filters
        <EmptyFilterState onOpenFilters={() => setIsFilterDialogOpen(true)} />
      ) : (
        // Feed Items
        <div className="space-y-6">
          <div ref={containerRef} className="space-y-4">
            <AnimatePresence>
              {currentItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  ref={(el) => {
                    if (el) itemRefs.current[index] = el;
                    if (index === focusedItemIndex)
                      selectedItemRef.current = el;
                  }}
                  className={cn(
                    "transition-all duration-150 ease-in-out",
                    index === focusedItemIndex &&
                      settings.enableKeyboardNavigation &&
                      "ring-2 ring-primary ring-offset-2"
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.05,
                  }}
                >
                  <FeedCard
                    item={item}
                    feed={feeds.find((f) => f.id === item.feed_id)}
                    isCompact={compactMode}
                    onToggleRead={handleToggleRead}
                    onToggleFavorite={handleToggleFavorite}
                    onToggleReadLater={handleToggleReadLater}
                    onOpenLink={handleOpenLink}
                    isFocused={
                      index === focusedItemIndex &&
                      settings.enableKeyboardNavigation
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {pageCount > 1 && (
            <FeedPagination
              currentPage={currentPage}
              pageCount={pageCount}
              onPageChange={setCurrentPage}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Memoized FeedCard component
const FeedCardMemo = memo(FeedCard);
