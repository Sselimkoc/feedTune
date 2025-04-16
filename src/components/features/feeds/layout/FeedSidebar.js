"use client";

import { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { ChevronDown, Rss, Youtube } from "lucide-react";
import Image from "next/image";

export const FeedSidebar = memo(function FeedSidebar({
  feeds = [],
  selectedFeed,
  onFeedSelect,
  stats = {},
}) {
  const { t } = useLanguage();
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedFeeds, setSelectedFeeds] = useState(new Set());

  // Feed'leri kategorilere ayır
  const rssFeeds = feeds.filter((feed) => feed.type === "rss");
  const youtubeFeeds = feeds.filter((feed) => feed.type === "youtube");

  // Feed seçimi işleyicisi
  const handleFeedSelect = useCallback(
    (feed) => {
      if (multiSelect) {
        setSelectedFeeds((prev) => {
          const next = new Set(prev);
          if (next.has(feed.id)) {
            next.delete(feed.id);
          } else {
            next.add(feed.id);
          }
          return next;
        });
      } else {
        onFeedSelect?.(feed.id);
      }
    },
    [multiSelect, onFeedSelect]
  );

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border shadow-sm">
      {/* İstatistikler */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">{t("feeds.stats")}</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("feeds.total")}</span>
            <span className="font-medium">{stats.totalFeeds || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("feeds.unread")}</span>
            <span className="font-medium">{stats.unreadItems || 0}</span>
          </div>
        </div>
      </div>

      {/* Feed Listesi */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Tüm Beslemeler */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 px-2 py-2 h-auto text-sm mb-2",
              !selectedFeed && "bg-accent text-accent-foreground font-medium"
            )}
            onClick={() => onFeedSelect?.(null)}
          >
            <div className="w-4 h-4 flex-shrink-0 text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-full h-full"
              >
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </div>
            <span>{t("feeds.allFeeds")}</span>
            <span className="ml-auto text-xs bg-accent/50 px-1.5 py-0.5 rounded-full">
              {stats.totalFeeds || 0}
            </span>
          </Button>

          {/* RSS Feed'leri */}
          <Collapsible defaultOpen className="mb-2">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md group">
              <div className="flex items-center gap-2">
                <Rss className="h-4 w-4 text-primary" />
                <span className="font-medium">{t("feeds.rssFeeds")}</span>
                <span className="text-xs text-muted-foreground">
                  ({rssFeeds.length})
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 pl-3 border-l-2 border-primary/10 ml-2">
              {rssFeeds.map((feed) => (
                <FeedItem
                  key={feed.id}
                  feed={feed}
                  isSelected={selectedFeed?.id === feed.id}
                  onClick={() => handleFeedSelect(feed)}
                  multiSelect={multiSelect}
                  categoryType="rss"
                />
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* YouTube Feed'leri */}
          <Collapsible defaultOpen className="mb-2">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md group">
              <div className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-500" />
                <span className="font-medium">{t("feeds.youtubeFeeds")}</span>
                <span className="text-xs text-muted-foreground">
                  ({youtubeFeeds.length})
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 pl-3 border-l-2 border-red-500/10 ml-2">
              {youtubeFeeds.map((feed) => (
                <FeedItem
                  key={feed.id}
                  feed={feed}
                  isSelected={selectedFeed?.id === feed.id}
                  onClick={() => handleFeedSelect(feed)}
                  multiSelect={multiSelect}
                  categoryType="youtube"
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
});

// Feed öğesi alt bileşeni
const FeedItem = memo(function FeedItem({
  feed,
  isSelected,
  onClick,
  multiSelect,
  categoryType,
}) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-2 px-2 py-1.5 h-auto text-xs font-normal mb-0.5",
        isSelected && "bg-accent text-accent-foreground",
        categoryType === "youtube" ? "hover:bg-red-500/5" : "hover:bg-primary/5"
      )}
      onClick={() => onClick(feed)}
    >
      <div className="w-3.5 h-3.5 flex-shrink-0">
        {feed.icon ? (
          <Image
            src={feed.icon}
            alt=""
            className="w-full h-full object-contain rounded-sm"
          />
        ) : feed.type === "youtube" ? (
          <Youtube className="w-full h-full text-red-500" />
        ) : (
          <Rss className="w-full h-full text-primary" />
        )}
      </div>
      <span className="truncate">{feed.title}</span>
      {feed.unread_count > 0 && (
        <span
          className={cn(
            "ml-auto text-xs px-1.5 py-0.5 rounded-full ",
            categoryType === "youtube"
              ? "bg-red-500/10 text-red-500"
              : "bg-primary/10 text-primary"
          )}
        >
          {feed.unread_count}
        </span>
      )}
    </Button>
  );
});
