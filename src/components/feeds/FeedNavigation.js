"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function FeedNavigation({
  feeds,
  focusedFeedIndex,
  setFocusedFeedIndex,
  getPreviousFeedIndex,
  getNextFeedIndex,
  getPreviousFeed,
  getNextFeed,
  isFeedActive,
  isFeedPrevious,
  isFeedNext,
  getIndicatorStyle,
  getDotStyle,
}) {
  if (!feeds || feeds.length <= 1) return null;

  return (
    <>
      {/* Navigation buttons */}
      <button
        onClick={() => setFocusedFeedIndex(getPreviousFeedIndex())}
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full",
          "bg-background/80 shadow-md hover:bg-background transition-all duration-500"
        )}
        aria-label={`Previous feed: ${getPreviousFeed()?.title || "Previous"}`}
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
    </>
  );
}
