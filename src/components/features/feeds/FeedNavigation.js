"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { memo, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export const FeedNavigation = memo(function FeedNavigation({
  feeds = [],
  selectedFeedId,
  onFeedSelect,
  onOpenFilters,
}) {
  const scrollRef = useRef(null);
  const selectedRef = useRef(null);

  // Seçili feed'e scroll yapma
  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      // Kaydırma özelliği şimdilik devre dışı bırakıldı
      // selectedRef.current.scrollIntoView({
      //   behavior: "smooth",
      //   block: "nearest",
      //   inline: "center",
      // });
    }
  }, [selectedFeedId]);

  // Erken dönüş kontrolü
  if (!feeds || feeds.length === 0) return null;

  // Helper functions for navigation
  const getPreviousFeedIndex = () => {
    const currentIndex = feeds.findIndex((feed) => feed.id === selectedFeedId);
    if (currentIndex <= 0) return feeds.length - 1;
    return currentIndex - 1;
  };

  const getNextFeedIndex = () => {
    const currentIndex = feeds.findIndex((feed) => feed.id === selectedFeedId);
    if (currentIndex === -1 || currentIndex === feeds.length - 1) return 0;
    return currentIndex + 1;
  };

  return (
    <div className="mb-6 bg-background/60 backdrop-blur-sm sticky top-0 z-10 py-2 border-b">
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

        <div className="flex items-center gap-1 flex-shrink-0">
          {feeds.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onFeedSelect(feeds[getPreviousFeedIndex()].id)}
                className="h-8 w-8 rounded-full"
                aria-label="Previous feed"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onFeedSelect(feeds[getNextFeedIndex()].id)}
                className="h-8 w-8 rounded-full"
                aria-label="Next feed"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {onOpenFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenFilters}
              className="h-8 rounded-full ml-1"
            >
              <Filter className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Filtrele</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
