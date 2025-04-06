"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FeedSelector({ feeds = [], selectedFeedId, onFeedSelect }) {
  const { t } = useLanguage();

  // Uygun feed seçilmemişse ve feedler varsa ilkini seç
  const effectiveSelectedFeedId =
    selectedFeedId || (feeds.length > 0 ? feeds[0].id : null);

  // Seçili feed bilgisi
  const selectedFeed =
    feeds.find((feed) => feed.id === effectiveSelectedFeedId) || null;

  // Feed'leri kategorize et
  const categories = {
    all: { id: "all", name: t("feeds.allFeeds"), feeds: feeds },
    unread: {
      id: "unread",
      name: t("feeds.unreadFeeds"),
      feeds: feeds.filter((feed) => feed.unread_count > 0),
    },
    favorites: {
      id: "favorites",
      name: t("feeds.favorites"),
      feeds: feeds.filter((feed) => feed.is_favorite),
    },
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Mobil Görünüm - Select */}
      <div className="md:hidden w-full">
        <Select value={effectiveSelectedFeedId} onValueChange={onFeedSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("feeds.selectFeed")}>
              {selectedFeed?.title || t("feeds.selectFeed")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-[300px]">
              {Object.values(categories).map((category) => (
                <div key={category.id} className="p-1">
                  <div className="text-sm font-semibold text-muted-foreground px-2 py-1">
                    {category.name}
                  </div>
                  {category.feeds.map((feed) => (
                    <SelectItem key={feed.id} value={feed.id} className="pl-4">
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate max-w-[180px]">
                          {feed.title}
                        </span>
                        {feed.unread_count > 0 && (
                          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {feed.unread_count}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Görünüm - Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="hidden md:block"
      >
        <Tabs
          defaultValue={effectiveSelectedFeedId}
          value={effectiveSelectedFeedId}
          onValueChange={onFeedSelect}
          className="w-full"
        >
          <ScrollArea className="w-full max-w-3xl">
            <TabsList className="h-10 p-1">
              {feeds.map((feed) => (
                <TabsTrigger
                  key={feed.id}
                  value={feed.id}
                  className={cn(
                    "h-8 px-3 relative",
                    feed.id === effectiveSelectedFeedId
                      ? "font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  <span className="truncate max-w-[150px]">{feed.title}</span>
                  {feed.unread_count > 0 && (
                    <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {feed.unread_count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>
        </Tabs>
      </motion.div>
    </div>
  );
}
