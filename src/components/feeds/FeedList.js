"use client";

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFeeds } from "@/hooks/useFeeds";
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
import { AddFeedButton } from "./AddFeedButton";
import { FeedPagination } from "./FeedPagination";
import { Loader2 } from "lucide-react";

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
    deleteFeed,
  } = useFeeds();
  const {
    showUnreadOnly,
    showFavoritesOnly,
    compactMode,
    enableKeyboardNavigation,
  } = useSettingsStore();

  // State management
  const [selectedFeedId, setSelectedFeedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // References
  const listRef = useRef(null);
  const selectedItemRef = useRef(null);

  // Memoized values
  const filteredFeeds = useMemo(() => {
    return feeds.filter((feed) => {
      if (showUnreadOnly) {
        return items.some((item) => item.feed_id === feed.id && !item.is_read);
      }
      if (showFavoritesOnly) {
        return items.some(
          (item) => item.feed_id === feed.id && item.is_favorite
        );
      }
      return true;
    });
  }, [feeds, items, showUnreadOnly, showFavoritesOnly]);

  const currentItems = useMemo(() => {
    let filtered = items;
    if (selectedFeedId) {
      filtered = filtered.filter((item) => item.feed_id === selectedFeedId);
    }
    if (showUnreadOnly) {
      filtered = filtered.filter((item) => !item.is_read);
    }
    if (showFavoritesOnly) {
      filtered = filtered.filter((item) => item.is_favorite);
    }
    return filtered;
  }, [items, selectedFeedId, showUnreadOnly, showFavoritesOnly]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return currentItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentItems, currentPage]);

  const pageCount = useMemo(() => {
    return getPageCount(currentItems.length, ITEMS_PER_PAGE);
  }, [currentItems]);

  // Load data when user changes
  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [user, refetch]);

  // Reset selected item when page changes
  useEffect(() => {
    setSelectedItemIndex(0);
  }, [currentPage, selectedFeedId]);

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNavigation) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedItemIndex((prev) =>
            Math.min(prev + 1, paginatedItems.length - 1)
          );
          setIsNavigating(true);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedItemIndex((prev) => Math.max(prev - 1, 0));
          setIsNavigating(true);
          break;
        case "Enter":
          e.preventDefault();
          if (paginatedItems[selectedItemIndex]) {
            const item = paginatedItems[selectedItemIndex];
            window.open(item.link, "_blank");
            toggleItemRead(item.id, true);
          }
          break;
        case "r":
          e.preventDefault();
          if (paginatedItems[selectedItemIndex]) {
            const item = paginatedItems[selectedItemIndex];
            toggleItemRead(item.id, !item.is_read);
          }
          break;
        case "f":
          e.preventDefault();
          if (paginatedItems[selectedItemIndex]) {
            const item = paginatedItems[selectedItemIndex];
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
          setSelectedItemIndex(0);
          setIsNavigating(true);
          break;
        case "End":
          e.preventDefault();
          setSelectedItemIndex(paginatedItems.length - 1);
          setIsNavigating(true);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    enableKeyboardNavigation,
    paginatedItems,
    selectedItemIndex,
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
  }, [selectedItemIndex, isNavigating]);

  // Page change handlers
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, []);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  }, [currentPage, handlePageChange]);

  const handleNextPage = useCallback(() => {
    if (currentPage < pageCount) {
      handlePageChange(currentPage + 1);
    }
  }, [currentPage, pageCount, handlePageChange]);

  // Feed selection handler
  const handleFeedSelect = useCallback(
    (feedId) => {
      setSelectedFeedId(feedId === selectedFeedId ? null : feedId);
      setCurrentPage(1);
    },
    [selectedFeedId]
  );

  // Memoized item action handlers
  const handleToggleRead = useCallback(
    (id, isRead) => {
      toggleItemRead(id, isRead);
    },
    [toggleItemRead]
  );

  const handleToggleFavorite = useCallback(
    (id, isFavorite) => {
      toggleItemFavorite(id, isFavorite);
    },
    [toggleItemFavorite]
  );

  const handleOpenLink = useCallback((link) => {
    window.open(link, "_blank");
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Empty state
  if (!feeds.length) {
    return <EmptyFeedState />;
  }

  // Empty items list
  if (currentItems.length === 0) {
    return (
      <div className="space-y-6">
        <FeedNavigation
          feeds={filteredFeeds}
          selectedFeedId={selectedFeedId}
          onFeedSelect={handleFeedSelect}
        />
        <div className="bg-card rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">No items found</h3>
          <p className="text-muted-foreground mb-4">
            {showUnreadOnly
              ? "You've read all items in this feed. Adjust your filters to see more."
              : showFavoritesOnly
              ? "No favorite items found. Mark some items as favorites to see them here."
              : "No items found in this feed."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showKeyboardHelp && (
          <KeyboardShortcutsHelp onClose={() => setShowKeyboardHelp(false)} />
        )}
      </AnimatePresence>

      <FeedNavigation
        feeds={filteredFeeds}
        selectedFeedId={selectedFeedId}
        onFeedSelect={handleFeedSelect}
      />

      <div
        ref={listRef}
        className="space-y-4 will-change-transform content-visibility-auto"
      >
        <AnimatePresence initial={false}>
          {paginatedItems.map((item, index) => (
            <motion.div
              key={item.id}
              ref={index === selectedItemIndex ? selectedItemRef : null}
              className={cn(
                "transition-all duration-150 ease-in-out",
                index === selectedItemIndex &&
                  enableKeyboardNavigation &&
                  "ring-2 ring-primary ring-offset-2"
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              layout
            >
              <FeedCardMemo
                item={item}
                feed={feeds.find((f) => f.id === item.feed_id)}
                isCompact={compactMode}
                onToggleRead={toggleItemRead}
                onToggleFavorite={toggleItemFavorite}
                onOpenLink={handleOpenLink}
                isFocused={
                  index === selectedItemIndex && enableKeyboardNavigation
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
          onPageChange={handlePageChange}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
        />
      )}
    </div>
  );
}

// Memoized FeedCard component
const FeedCardMemo = memo(FeedCard);
