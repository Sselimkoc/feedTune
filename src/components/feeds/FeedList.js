"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useFeeds } from "@/hooks/useFeeds";
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

export function FeedList() {
  const [currentPages, setCurrentPages] = useState({});
  const [focusedFeedIndex, setFocusedFeedIndex] = useState(0);
  const [focusedItemIndex, setFocusedItemIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const {
    feeds,
    isLoading,
    error,
    deleteFeed,
    toggleItemRead,
    toggleItemFavorite,
  } = useFeeds();

  // Refs for the focused item and feed card
  const focusedItemRef = useRef(null);
  const focusedFeedRef = useRef(null);
  const containerRef = useRef(null);

  // Sayfa değişikliği sonrası odaklanılacak item için state
  const [pendingFocusLastItem, setPendingFocusLastItem] = useState(false);

  // Helper functions for navigation - defined before any early returns
  const getPreviousFeedIndex = useCallback(() => {
    if (!feeds || feeds.length === 0) return 0;
    return focusedFeedIndex === 0 ? feeds.length - 1 : focusedFeedIndex - 1;
  }, [focusedFeedIndex, feeds]);

  const getNextFeedIndex = useCallback(() => {
    if (!feeds || feeds.length === 0) return 0;
    return focusedFeedIndex === feeds.length - 1 ? 0 : focusedFeedIndex + 1;
  }, [focusedFeedIndex, feeds]);

  const getPreviousFeed = useCallback(() => {
    if (!feeds || feeds.length === 0) return null;
    const prevIndex = getPreviousFeedIndex();
    return feeds[prevIndex];
  }, [feeds, getPreviousFeedIndex]);

  const getNextFeed = useCallback(() => {
    if (!feeds || feeds.length === 0) return null;
    const nextIndex = getNextFeedIndex();
    return feeds[nextIndex];
  }, [feeds, getNextFeedIndex]);

  // Helper functions for feed position determination
  const isFeedPrevious = useCallback(
    (index) => {
      if (!feeds || feeds.length === 0) return false;
      return (
        (focusedFeedIndex === 0 && index === feeds.length - 1) ||
        index === focusedFeedIndex - 1
      );
    },
    [feeds, focusedFeedIndex]
  );

  const isFeedNext = useCallback(
    (index) => {
      if (!feeds || feeds.length === 0) return false;
      return (
        (focusedFeedIndex === feeds.length - 1 && index === 0) ||
        index === focusedFeedIndex + 1
      );
    },
    [feeds, focusedFeedIndex]
  );

  const isFeedActive = useCallback(
    (index) => {
      return focusedFeedIndex === index;
    },
    [focusedFeedIndex]
  );

  // Style helper functions
  const getIndicatorStyle = useCallback((isActive, isPrevious, isNext) => {
    if (isActive) return "opacity-100";
    if (isPrevious || isNext) return "opacity-70 hover:opacity-90";
    return "opacity-50 hover:opacity-80";
  }, []);

  const getDotStyle = useCallback((isActive, isPrevious, isNext) => {
    if (isActive) return "bg-primary w-3 h-3";
    if (isPrevious || isNext)
      return "bg-muted-foreground/50 group-hover:bg-muted-foreground/70";
    return "bg-muted-foreground/30 group-hover:bg-muted-foreground/50";
  }, []);

  // Memoize functions with useCallback
  const getItemsForPage = useCallback(
    (items, feedId) => {
      const currentPage = currentPages[feedId] || 0;
      return items
        .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
        .slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
    },
    [currentPages, itemsPerPage]
  );

  const getTotalPages = useCallback(
    (items) => {
      return Math.ceil(items.length / itemsPerPage);
    },
    [itemsPerPage]
  );

  const nextPage = useCallback(
    (feedId, totalItems) => {
      const totalPages = getTotalPages(totalItems);
      const currentPage = currentPages[feedId] || 0;
      if (currentPage < totalPages - 1) {
        setCurrentPages((prev) => ({
          ...prev,
          [feedId]: currentPage + 1,
        }));
      }
    },
    [currentPages, getTotalPages]
  );

  const prevPage = useCallback(
    (feedId) => {
      const currentPage = currentPages[feedId] || 0;
      if (currentPage > 0) {
        setCurrentPages((prev) => ({
          ...prev,
          [feedId]: currentPage - 1,
        }));
      }
    },
    [currentPages]
  );

  // Scroll to focused feed when it changes
  useEffect(() => {
    if (focusedFeedRef.current) {
      focusedFeedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }, [focusedFeedIndex]);

  // Scroll to focused item when it changes
  useEffect(() => {
    if (focusedItemRef.current) {
      focusedItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [focusedItemIndex, focusedFeedIndex]);

  // Sayfa değişikliği sonrası son iteme odaklanma
  useEffect(() => {
    if (pendingFocusLastItem) {
      const currentFeed = feeds[focusedFeedIndex];
      if (currentFeed) {
        const items = currentFeed.items || [];
        const currentItems = getItemsForPage(items, currentFeed.id);
        setFocusedItemIndex(currentItems.length - 1);
        setPendingFocusLastItem(false);
      }
    }
  }, [
    currentPages,
    pendingFocusLastItem,
    feeds,
    focusedFeedIndex,
    getItemsForPage,
  ]);

  const handleItemsPerPageChange = useCallback((value) => {
    setItemsPerPage(Number(value));
    setCurrentPages({});
  }, []);

  // Keyboard navigation effect with all dependencies
  useEffect(() => {
    function handleKeyDown(e) {
      const currentFeed = feeds[focusedFeedIndex];
      if (!currentFeed) return;

      const items = currentFeed.items || [];
      const currentPage = currentPages[currentFeed.id] || 0;
      const currentItems = getItemsForPage(items, currentFeed.id);
      const totalPages = getTotalPages(items);

      switch (e.key) {
        case "Tab":
          e.preventDefault();
          setFocusedFeedIndex((prev) =>
            e.shiftKey
              ? (prev - 1 + feeds.length) % feeds.length
              : (prev + 1) % feeds.length
          );
          setFocusedItemIndex(0);
          break;

        case "ArrowUp":
          e.preventDefault();
          setFocusedFeedIndex((prevIndex) =>
            prevIndex === null || prevIndex === 0
              ? feeds.length - 1
              : prevIndex - 1
          );
          setFocusedItemIndex(0);
          break;

        case "ArrowDown":
          e.preventDefault();
          setFocusedFeedIndex((prevIndex) =>
            prevIndex === null || prevIndex === feeds.length - 1
              ? 0
              : prevIndex + 1
          );
          setFocusedItemIndex(0);
          break;

        case "ArrowRight":
          e.preventDefault();
          if (currentItems.length > 0) {
            if (focusedItemIndex === currentItems.length - 1) {
              if (currentPage < totalPages - 1) {
                nextPage(currentFeed.id, items);
                setFocusedItemIndex(0);
              } else {
                setFocusedItemIndex(0);
              }
            } else {
              setFocusedItemIndex((prevIndex) => prevIndex + 1);
            }
          }
          break;

        case "ArrowLeft":
          e.preventDefault();
          if (currentItems.length > 0) {
            if (focusedItemIndex === 0) {
              if (currentPage > 0) {
                prevPage(currentFeed.id);
                setPendingFocusLastItem(true);
              } else {
                setFocusedItemIndex(currentItems.length - 1);
              }
            } else {
              setFocusedItemIndex((prevIndex) => prevIndex - 1);
            }
          }
          break;

        case "Enter":
          const focusedItem = currentItems[focusedItemIndex];
          if (focusedItem) {
            window.open(focusedItem.link, "_blank");
            toggleItemRead(focusedItem.id, !focusedItem.is_read);
          }
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    feeds,
    focusedFeedIndex,
    focusedItemIndex,
    currentPages,
    itemsPerPage,
    getItemsForPage,
    getTotalPages,
    nextPage,
    prevPage,
    toggleItemRead,
    pendingFocusLastItem,
  ]);

  // Determine which feeds to show (always 3 feeds)
  const getVisibleFeeds = useCallback(() => {
    if (!feeds || feeds.length === 0) return [];

    if (feeds.length <= 3) {
      // If we have 3 or fewer feeds, show all of them
      return feeds.map((feed, index) => ({
        feed,
        index,
        position:
          index === focusedFeedIndex
            ? "center"
            : index < focusedFeedIndex
            ? "top"
            : "bottom",
      }));
    }

    // For any feed, show the previous feed above and the next feed below
    const prevIndex = getPreviousFeedIndex();
    const nextIndex = getNextFeedIndex();

    return [
      { feed: feeds[prevIndex], index: prevIndex, position: "top" },
      {
        feed: feeds[focusedFeedIndex],
        index: focusedFeedIndex,
        position: "center",
      },
      { feed: feeds[nextIndex], index: nextIndex, position: "bottom" },
    ];
  }, [feeds, focusedFeedIndex, getPreviousFeedIndex, getNextFeedIndex]);

  const visibleFeeds = getVisibleFeeds();

  // Helper function to get card position styles with circular animation
  const getCardPositionStyles = useCallback((position, index, total) => {
    const radius = 300;
    const angle = (index / total) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    const baseStyles =
      "absolute w-full max-w-4xl transition-all duration-300 ease-out";

    switch (position) {
      case "top":
        return cn(baseStyles, "opacity-70 hover:opacity-100 hover:scale-90", {
          transform: `translate(${x}px, ${y}px) scale(0.75) rotate(${
            angle * (180 / Math.PI)
          }deg)`,
        });
      case "bottom":
        return cn(baseStyles, "opacity-70 hover:opacity-100 hover:scale-90", {
          transform: `translate(${x}px, ${y}px) scale(0.75) rotate(${
            angle * (180 / Math.PI)
          }deg)`,
        });
      case "center":
        return cn(
          "w-full max-w-4xl z-10 shadow-xl scale-100 transition-all duration-300 ease-in-out"
        );
      default:
        return cn(baseStyles, "opacity-40 scale-50 hover:scale-60");
    }
  }, []);

  if (isLoading) {
    return <FeedSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading feeds: {error.message}
      </div>
    );
  }

  if (!feeds?.length) {
    return <EmptyFeedState />;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <KeyboardShortcutsHelp />
          <AddFeedButton variant="outline" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Items per page:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fixed-position carousel container */}
      <div
        ref={containerRef}
        className="relative h-[calc(100vh-200px)] overflow-hidden mt-8"
      >
        {/* Navigation buttons and indicators */}
        <FeedNavigation
          feeds={feeds}
          focusedFeedIndex={focusedFeedIndex}
          setFocusedFeedIndex={setFocusedFeedIndex}
          getPreviousFeedIndex={getPreviousFeedIndex}
          getNextFeedIndex={getNextFeedIndex}
          getPreviousFeed={getPreviousFeed}
          getNextFeed={getNextFeed}
          isFeedActive={isFeedActive}
          isFeedPrevious={isFeedPrevious}
          isFeedNext={isFeedNext}
          getIndicatorStyle={getIndicatorStyle}
          getDotStyle={getDotStyle}
        />

        {/* This is the fixed-position container for all cards */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Render all visible feeds */}
          {visibleFeeds.map((feedData, index) => (
            <motion.div
              key={feedData.index}
              className={getCardPositionStyles(
                feedData.position,
                index,
                visibleFeeds.length
              )}
              ref={feedData.position === "center" ? focusedFeedRef : null}
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{
                scale: feedData.position === "center" ? 1 : 0.75,
                opacity: feedData.position === "center" ? 1 : 0.7,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <FeedCard
                feed={feedData.feed}
                index={feedData.index}
                isFocused={feedData.position === "center"}
                focusedFeedIndex={focusedFeedIndex}
                focusedItemIndex={focusedItemIndex}
                currentPages={currentPages}
                itemsPerPage={itemsPerPage}
                getItemsForPage={getItemsForPage}
                getTotalPages={getTotalPages}
                prevPage={prevPage}
                nextPage={nextPage}
                toggleItemRead={toggleItemRead}
                toggleItemFavorite={toggleItemFavorite}
                deleteFeed={deleteFeed}
                setFocusedFeedIndex={setFocusedFeedIndex}
                focusedItemRef={
                  feedData.position === "center" ? focusedItemRef : null
                }
                position={feedData.position}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
