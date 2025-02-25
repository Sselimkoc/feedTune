"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { useFeeds } from "@/hooks/useFeeds";
import { AnimatePresence, motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";

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
  const { feeds, isLoading, error, deleteFeed, updateFeedItem } = useFeeds();

  // Refs for the focused item and feed card
  const focusedItemRef = useRef(null);
  const focusedFeedRef = useRef(null);

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

  // Scroll the focused item into view
  const scrollToFocusedItem = useCallback(() => {
    if (focusedItemRef.current) {
      focusedItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, []);

  // Scroll the focused feed into view
  const scrollFeedToCenter = useCallback(() => {
    if (focusedFeedRef.current) {
      focusedFeedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, []);

  // Update scroll position when focused item changes
  useEffect(() => {
    scrollToFocusedItem();
  }, [focusedItemIndex, focusedFeedIndex, currentPages, scrollToFocusedItem]);

  // Update feed scroll position when focused feed changes
  useEffect(() => {
    scrollFeedToCenter();
  }, [focusedFeedIndex, scrollFeedToCenter]);

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
          if (focusedItemIndex > 0) {
            setFocusedItemIndex((prev) => prev - 1);
          } else if (currentPage > 0) {
            prevPage(currentFeed.id);
            setFocusedItemIndex(itemsPerPage - 1);
          }
          break;

        case "ArrowDown":
          e.preventDefault();
          if (focusedItemIndex < currentItems.length - 1) {
            setFocusedItemIndex((prev) => prev + 1);
          } else if (currentPage < totalPages - 1) {
            nextPage(currentFeed.id, items);
            setFocusedItemIndex(0);
          }
          break;

        case "ArrowRight":
          if (currentPage < totalPages - 1) {
            nextPage(currentFeed.id, items);
            setFocusedItemIndex(0);
          }
          break;

        case "ArrowLeft":
          if (currentPage > 0) {
            prevPage(currentFeed.id);
            setFocusedItemIndex(0);
          }
          break;

        case "Enter":
          const focusedItem = currentItems[focusedItemIndex];
          if (focusedItem) {
            window.open(focusedItem.link, "_blank");
            updateFeedItem({
              itemId: focusedItem.id,
              updates: { is_read: true },
            });
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
    updateFeedItem,
  ]);

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
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-2">
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

      {feeds.map((feed, index) => {
        const items = feed.items || [];
        const currentPage = currentPages[feed.id] || 0;
        const totalPages = getTotalPages(items);
        const currentItems = getItemsForPage(items, feed.id);
        const isFocused = focusedFeedIndex === index;

        return (
          <Card
            key={feed.id}
            tabIndex={0}
            ref={isFocused ? focusedFeedRef : null}
            className={`outline-none transition-shadow duration-200 ${
              isFocused ? "ring-2 ring-primary ring-offset-2" : ""
            }`}
            onFocus={() => setFocusedFeedIndex(index)}
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
                  onClick={() => deleteFeed(feed.id)}
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
              <div
                className="flex flex-col"
                style={{ height: itemsPerPage * 120 + 80 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentPage}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 space-y-4 relative"
                  >
                    {currentItems.map((item, itemIndex) => (
                      <motion.div
                        key={item.id}
                        layout
                        ref={
                          focusedFeedIndex === index &&
                          focusedItemIndex === itemIndex
                            ? focusedItemRef
                            : null
                        }
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className={`group flex items-start gap-4 p-2 rounded-md hover:bg-accent transition-colors h-[120px] ${
                          focusedFeedIndex === index &&
                          focusedItemIndex === itemIndex
                            ? "ring-2 ring-primary ring-offset-2 bg-accent"
                            : ""
                        }`}
                      >
                        {feed.type === "youtube" && (
                          <div className="w-[120px] h-[90px] flex-shrink-0">
                            {item.thumbnail && (
                              <Image
                                src={item.thumbnail}
                                alt={item.title}
                                width={160}
                                height={90}
                                className="object-cover rounded w-full h-full"
                                sizes="120px"
                                placeholder="empty"
                              />
                            )}
                          </div>
                        )}
                        <div
                          className={`flex-1 min-w-0 flex flex-col h-full ${
                            feed.type === "rss" ? "pl-2" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() =>
                                updateFeedItem({
                                  itemId: item.id,
                                  updates: { is_read: true },
                                })
                              }
                              className="flex-1"
                            >
                              <h3
                                className={`text-base font-medium line-clamp-2 ${
                                  item.is_read ? "text-muted-foreground" : ""
                                }`}
                              >
                                {item.title}
                              </h3>
                            </a>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  updateFeedItem({
                                    itemId: item.id,
                                    updates: {
                                      is_favorite: !item.is_favorite,
                                    },
                                  })
                                }
                              >
                                <Star
                                  className={`h-4 w-4 ${
                                    item.is_favorite
                                      ? "fill-yellow-400 text-yellow-400"
                                      : ""
                                  }`}
                                />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  updateFeedItem({
                                    itemId: item.id,
                                    updates: { is_read: !item.is_read },
                                  })
                                }
                              >
                                <Check
                                  className={`h-4 w-4 ${
                                    item.is_read ? "text-green-500" : ""
                                  }`}
                                />
                              </Button>
                              <Button variant="ghost" size="icon" asChild>
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2 flex-1">
                              {item.description}
                            </p>
                          )}
                          {item.published_at && (
                            <p className="text-xs text-muted-foreground mt-auto">
                              {new Date(item.published_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>

                {/* Feed Card Pagination Controls */}
                {items.length > itemsPerPage && (
                  <div className="flex justify-between items-center gap-4 mt-4 pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => prevPage(feed.id)}
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
                      onClick={() => nextPage(feed.id, items)}
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
        );
      })}
    </div>
  );
}
