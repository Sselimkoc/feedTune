"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { memo, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export const FeedNavigation = memo(function FeedNavigation({
  feeds = [],
  selectedFeedIds = [],
  onFeedSelect,
  onDeleteFeed,
}) {
  const scrollRef = useRef(null);
  const selectedRefs = useRef({});

  // Seçili feed'lere scroll yapma
  useEffect(() => {
    if (selectedFeedIds.length > 0 && scrollRef.current) {
      // Son seçilen feed'e scroll yap
      const lastSelectedId = selectedFeedIds[selectedFeedIds.length - 1];
      if (selectedRefs.current[lastSelectedId]) {
        selectedRefs.current[lastSelectedId].scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [selectedFeedIds]);

  // Erken dönüş kontrolü
  if (!feeds || feeds.length === 0) return null;

  return (
    <div className="mb-6 bg-background/60 backdrop-blur-sm sticky top-0 z-10 py-2 border-b">
      <div className="flex justify-between items-center gap-2">
        <ScrollArea
          className="w-full whitespace-nowrap rounded-md"
          ref={scrollRef}
        >
          <div className="flex space-x-2 p-1">
            {feeds.map((feed) => {
              const isSelected = selectedFeedIds.includes(feed.id);
              const isYoutube = feed.type === "youtube";

              return (
                <Button
                  key={feed.id}
                  ref={(el) => (selectedRefs.current[feed.id] = el)}
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
          {selectedFeedIds.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onFeedSelect(null)}
              title="Tüm seçimleri temizle"
            >
              <X className="h-4 w-4" />
              {selectedFeedIds.length > 1 && (
                <Badge
                  variant="secondary"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                >
                  {selectedFeedIds.length}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
