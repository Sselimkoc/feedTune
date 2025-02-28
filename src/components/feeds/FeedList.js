"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  Rss,
} from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useFeeds } from "@/hooks/useFeeds";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";
import { cn } from "@/lib/utils";

function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-col space-y-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex gap-4">
                  <div className="w-[120px] h-[68px] bg-muted animate-pulse rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

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
    return (
      <div className="p-4">No feeds found. Add some feeds to get started!</div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center gap-4">
        <KeyboardShortcutsHelp />
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
        {/* Navigation buttons */}
        {feeds.length > 1 && (
          <>
            <button
              onClick={() => setFocusedFeedIndex(getPreviousFeedIndex())}
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full",
                "bg-background/80 shadow-md hover:bg-background transition-all duration-500"
              )}
              aria-label={`Previous feed: ${
                getPreviousFeed()?.title || "Previous"
              }`}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => setFocusedFeedIndex(getNextFeedIndex())}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full",
                "bg-background/80 shadow-md hover:bg-background transition-all duration-500"
              )}
              aria-label={`Next feed: ${getNextFeed()?.title || "Next"}`}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

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

      {/* Navigation Indicators */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        {feeds.map((feed, index) => {
          // Determine feed position relative to focused feed
          const isActive = isFeedActive(index);
          const isPrevious = isFeedPrevious(index);
          const isNext = isFeedNext(index);

          return (
            <button
              key={index}
              onClick={() => setFocusedFeedIndex(index)}
              className={cn(
                "flex items-center gap-2 transition-all duration-500 group",
                getIndicatorStyle(isActive, isPrevious, isNext)
              )}
              aria-label={`Go to feed ${index + 1}: ${feed.title}`}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-500",
                  getDotStyle(isActive, isPrevious, isNext)
                )}
              />
              <span
                className={cn(
                  "text-xs whitespace-nowrap max-w-0 overflow-hidden transition-all duration-500",
                  isActive
                    ? "max-w-[100px] opacity-100"
                    : "group-hover:max-w-[100px] opacity-0 group-hover:opacity-100"
                )}
              >
                {feed.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Extracted FeedCard component to avoid repetition
function FeedCard({
  feed,
  index,
  isFocused,
  focusedFeedIndex,
  focusedItemIndex,
  currentPages,
  itemsPerPage,
  getItemsForPage,
  getTotalPages,
  prevPage,
  nextPage,
  toggleItemRead,
  toggleItemFavorite,
  deleteFeed,
  setFocusedFeedIndex,
  focusedItemRef,
  position = "other",
}) {
  if (!feed) return null;

  const items = feed.items || [];
  const currentPage = currentPages[feed.id] || 0;
  const totalPages = getTotalPages(items);
  const currentItems = getItemsForPage(items, feed.id);

  return (
    <div className="w-full transition-all duration-500">
      <Card
        tabIndex={0}
        className={cn(
          "outline-none transition-all duration-500",
          isFocused
            ? "ring-2 ring-primary ring-offset-4 shadow-xl bg-card"
            : position === "top" || position === "bottom"
            ? "bg-card/95 hover:bg-card shadow-lg"
            : "bg-card/90 hover:bg-card/95 shadow-md"
        )}
        onClick={() => setFocusedFeedIndex(index)}
      >
        <CardHeader className="flex flex-col space-y-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {feed.type === "youtube" && feed.channel_avatar && (
                <Image
                  src={feed.channel_avatar}
                  alt={feed.title}
                  width={40}
                  height={40}
                  className="rounded-full"
                  priority
                  placeholder="empty"
                />
              )}
              {feed.type === "rss" && feed.site_favicon && (
                <Image
                  src={feed.site_favicon}
                  alt={feed.title}
                  width={24}
                  height={24}
                  className="rounded"
                  placeholder="empty"
                />
              )}
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold truncate">
                  {feed.title}
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  ({items.length} items)
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                deleteFeed(feed.id);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {feed.description}
          </p>
          <div className="flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
              {currentItems.map((item, itemIndex) => (
                <div
                  key={item.id}
                  ref={
                    focusedFeedIndex === index &&
                    focusedItemIndex === itemIndex &&
                    focusedItemRef
                      ? focusedItemRef
                      : null
                  }
                  className={cn(
                    "group flex flex-col bg-card rounded-lg shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden",
                    focusedFeedIndex === index && focusedItemIndex === itemIndex
                      ? "ring-2 ring-primary ring-offset-4 shadow-xl scale-[1.02] z-10"
                      : ""
                  )}
                >
                  {/* Thumbnail Section */}
                  <div
                    className="relative w-full"
                    style={{ minHeight: "200px" }}
                  >
                    {feed.type === "youtube" && item.thumbnail ? (
                      <div className="relative aspect-video w-full">
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-accent/5 via-accent/10 to-background">
                        <div className="flex flex-col items-center text-center space-y-4">
                          {feed.type === "rss" && feed.site_favicon ? (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-background p-2 shadow-sm">
                              <Image
                                src={feed.site_favicon}
                                alt={feed.title}
                                width={48}
                                height={48}
                                className="object-contain"
                                priority
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Rss className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          <div className="space-y-1">
                            <h4 className="text-sm font-medium text-foreground/80">
                              {feed.title}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.published_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>

                  {/* Content Section */}
                  <div className="flex flex-col flex-1 p-6">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={cn(
                          "text-base font-medium line-clamp-2",
                          item.is_read
                            ? "text-muted-foreground"
                            : "text-foreground"
                        )}
                      >
                        {item.title}
                      </h3>
                    </div>

                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-6 pt-6 border-t">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-8 px-3 transition-all duration-200",
                            item.is_favorite
                              ? "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500"
                              : "hover:bg-yellow-500/10 hover:text-yellow-500"
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleItemFavorite(item.id, !item.is_favorite);
                          }}
                        >
                          <Star
                            className={cn(
                              "h-4 w-4 mr-1.5 transition-all",
                              item.is_favorite ? "fill-yellow-500" : "fill-none"
                            )}
                          />
                          <span className="text-sm">
                            {item.is_favorite
                              ? "Favorilerde"
                              : "Favorilere Ekle"}
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-8 px-3 transition-all duration-200",
                            item.is_read
                              ? "bg-green-500/10 hover:bg-green-500/20 text-green-500"
                              : "hover:bg-green-500/10 hover:text-green-500"
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleItemRead(item.id, !item.is_read);
                          }}
                        >
                          <Check
                            className={cn(
                              "h-4 w-4 mr-1.5",
                              item.is_read ? "text-green-500" : ""
                            )}
                          />
                          <span className="text-sm">
                            {item.is_read ? "Okundu" : "Okunmadı"}
                          </span>
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 hover:bg-primary/5 transition-colors duration-200"
                        asChild
                      >
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleItemRead(item.id, !item.is_read);
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-1.5" />
                          <span className="text-sm">Oku</span>
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Feed Card Pagination Controls */}
            {items.length > itemsPerPage && (
              <div className="flex justify-between items-center gap-4 mt-6 pt-6 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevPage(feed.id);
                  }}
                  disabled={currentPage === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextPage(feed.id, items);
                  }}
                  disabled={currentPage === totalPages - 1}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
