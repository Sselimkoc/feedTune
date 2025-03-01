"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { memo, useMemo } from "react";
import Image from "next/image";

export const FeedNavigation = memo(function FeedNavigation({
  feeds = [],
  selectedFeedId,
  onFeedSelect,
}) {
  // Find the current feed index - useMemo her zaman çağrılmalı
  const currentFeedIndex = useMemo(() => {
    if (!feeds || feeds.length <= 0 || !selectedFeedId) return -1;
    return feeds.findIndex((feed) => feed.id === selectedFeedId);
  }, [feeds, selectedFeedId]);

  // Helper functions for navigation
  const getPreviousFeedIndex = () => {
    if (currentFeedIndex <= 0) return feeds.length - 1;
    return currentFeedIndex - 1;
  };

  const getNextFeedIndex = () => {
    if (currentFeedIndex === -1 || currentFeedIndex === feeds.length - 1)
      return 0;
    return currentFeedIndex + 1;
  };

  const getPreviousFeed = () => {
    return feeds[getPreviousFeedIndex()];
  };

  const getNextFeed = () => {
    return feeds[getNextFeedIndex()];
  };

  // Erken dönüş kontrolü
  if (!feeds || feeds.length <= 1) return null;

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {feeds.map((feed) => (
          <button
            key={feed.id}
            onClick={() => onFeedSelect(feed.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2",
              feed.id === selectedFeedId
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {feed.site_favicon && (
              <div className="relative w-4 h-4 flex-shrink-0">
                <Image
                  src={feed.site_favicon}
                  alt=""
                  width={16}
                  height={16}
                  className={cn(
                    "object-cover",
                    feed.type === "youtube" ? "rounded-full" : "rounded"
                  )}
                  unoptimized
                />
              </div>
            )}
            {feed.title}
          </button>
        ))}
      </div>

      {feeds.length > 1 && (
        <div className="flex gap-1">
          <button
            onClick={() => onFeedSelect(getPreviousFeed().id)}
            className="p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            aria-label={`Previous feed: ${
              getPreviousFeed()?.title || "Previous"
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onFeedSelect(getNextFeed().id)}
            className="p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            aria-label={`Next feed: ${getNextFeed()?.title || "Next"}`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
});
