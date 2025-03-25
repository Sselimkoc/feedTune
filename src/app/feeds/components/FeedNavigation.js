"use client";

import { memo, useRef, useEffect } from "react";
import Image from "next/image";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const FeedNavigation = memo(function FeedNavigation({
  feeds = [],
  selectedFeedId,
  onFeedSelect,
}) {
  const scrollRef = useRef(null);
  const selectedRef = useRef(null);

  // Seçili feed'e scroll yapma
  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      // Optimize edilmiş viewport kontrolü
      const container = scrollRef.current;
      const element = selectedRef.current;

      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      // Element görünür alanda değilse scroll yapma
      if (
        elementRect.left < containerRect.left ||
        elementRect.right > containerRect.right
      ) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [selectedFeedId]);

  // Erken dönüş kontrolü
  if (!feeds || feeds.length === 0) return null;

  // Önceki feed'e git
  const navigateToPreviousFeed = () => {
    const currentIndex = feeds.findIndex((feed) => feed.id === selectedFeedId);
    if (currentIndex <= 0) {
      onFeedSelect(feeds[feeds.length - 1].id);
    } else {
      onFeedSelect(feeds[currentIndex - 1].id);
    }
  };

  // Sonraki feed'e git
  const navigateToNextFeed = () => {
    const currentIndex = feeds.findIndex((feed) => feed.id === selectedFeedId);
    if (currentIndex === -1 || currentIndex === feeds.length - 1) {
      onFeedSelect(feeds[0].id);
    } else {
      onFeedSelect(feeds[currentIndex + 1].id);
    }
  };

  return (
    <div className="flex justify-between items-center gap-2">
      <ScrollArea
        className="w-full whitespace-nowrap rounded-md"
        ref={scrollRef}
      >
        <div className="flex space-x-2 p-1">
          {feeds.map((feed) => {
            const isSelected = feed.id === selectedFeedId;
            const isYoutube = feed.type === "youtube";

            return (
              <Button
                key={feed.id}
                ref={isSelected ? selectedRef : null}
                onClick={() => onFeedSelect(feed.id)}
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-8 px-3 transition-all duration-200 flex items-center gap-1.5 rounded-full",
                  isSelected ? "shadow-sm" : "hover:bg-muted"
                )}
                aria-pressed={isSelected}
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
                        isYoutube ? "rounded-full" : "rounded"
                      )}
                      unoptimized
                    />
                  </div>
                )}
                <span
                  className={cn(
                    "text-xs font-medium truncate max-w-[120px]",
                    isSelected ? "" : "text-muted-foreground"
                  )}
                >
                  {feed.title}
                </span>
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-2" />
      </ScrollArea>

      {feeds.length > 1 && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={navigateToPreviousFeed}
            className="h-8 w-8 rounded-full"
            aria-label="Önceki feed"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={navigateToNextFeed}
            className="h-8 w-8 rounded-full"
            aria-label="Sonraki feed"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
});
