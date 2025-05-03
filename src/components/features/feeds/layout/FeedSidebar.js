"use client";

import { memo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Rss,
  Youtube,
  LayoutGrid,
  Eye,
  Filter,
  BookOpen,
  BarChart3,
} from "lucide-react";
import { youtubeService } from "@/lib/youtube/service";
import Image from "next/image";

export const FeedSidebar = memo(function FeedSidebar({
  feeds = [],
  selectedFeed,
  onFeedSelect,
  stats = {},
}) {
  const { t } = useLanguage();
  const [openCategories, setOpenCategories] = useState({
    rss: true,
    youtube: true,
  });

  // Feed'leri kategorilere ayır
  const rssFeeds = feeds.filter((feed) => feed.type === "rss");
  const youtubeFeeds = feeds.filter((feed) => feed.type === "youtube");

  // Feed seçimi işleyicisi
  const handleFeedSelect = useCallback(
    (feed) => {
      onFeedSelect?.(feed.id);
    },
    [onFeedSelect]
  );

  const toggleCategory = (category) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden border-border/50 bg-card/95 backdrop-blur-sm">
      {/* İstatistikler */}
      <CardHeader className="px-4 pt-4 pb-3 border-b border-border/20 space-y-1 bg-muted/30">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          {t("feeds.stats")}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 px-4 py-3 text-sm">
          <motion.div
            className="bg-primary/5 rounded-lg p-2 flex flex-col"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <LayoutGrid className="h-3 w-3" />
              {t("feeds.total")}
            </span>
            <span className="text-lg font-semibold text-foreground">
              {stats.totalFeeds || 0}
            </span>
          </motion.div>

          <motion.div
            className="bg-blue-500/5 rounded-lg p-2 flex flex-col"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Eye className="h-3 w-3" />
              {t("feeds.unread")}
            </span>
            <span className="text-lg font-semibold text-blue-500">
              {stats.unreadItems || 0}
            </span>
          </motion.div>
        </div>

        {/* Feed Listesi */}
        <ScrollArea className="flex-1 px-2 pt-2 pb-6">
          <AnimatePresence>
            {/* Tüm Beslemeler */}
            <motion.div
              key="all-feeds"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-2"
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2 px-3 py-2.5 h-auto text-sm mb-2 relative overflow-hidden",
                  !selectedFeed &&
                    "bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-medium"
                )}
                onClick={() => onFeedSelect?.(null)}
              >
                {!selectedFeed && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"
                    layoutId="activeHighlight"
                  />
                )}
                <div className="w-5 h-5 flex-shrink-0">
                  <LayoutGrid className="w-full h-full text-primary" />
                </div>
                <span>{t("feeds.allFeeds")}</span>
                <Badge className="ml-auto" variant="outline">
                  {stats.totalFeeds || 0}
                </Badge>
              </Button>
            </motion.div>

            {/* RSS Feed'leri */}
            <div key="rss-feeds" className="mb-3">
              <Collapsible
                open={openCategories.rss}
                onOpenChange={() => toggleCategory("rss")}
                className="mb-2"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center justify-between w-full px-3 py-2.5 h-auto hover:bg-primary/5 rounded-md group"
                  >
                    <div className="flex items-center gap-2">
                      <Rss className="h-5 w-5 text-primary" />
                      <span className="font-medium">{t("feeds.rssFeeds")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary"
                      >
                        {rssFeeds.length}
                      </Badge>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform duration-200",
                          openCategories.rss && "rotate-180"
                        )}
                      />
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-1 pl-4 space-y-1">
                  <AnimatePresence>
                    {rssFeeds.map((feed, index) => (
                      <motion.div
                        key={`${feed.id}-rss`}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                      >
                        <FeedItem
                          feed={feed}
                          isSelected={selectedFeed?.id === feed.id}
                          onClick={() => handleFeedSelect(feed)}
                          categoryType="rss"
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* YouTube Feed'leri */}
            <div key="youtube-feeds" className="mb-2">
              <Collapsible
                open={openCategories.youtube}
                onOpenChange={() => toggleCategory("youtube")}
                className="mb-2"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center justify-between w-full px-3 py-2.5 h-auto hover:bg-red-500/5 rounded-md group"
                  >
                    <div className="flex items-center gap-2">
                      <Youtube className="h-5 w-5 text-red-500" />
                      <span className="font-medium">
                        {t("feeds.youtubeFeeds")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-500"
                      >
                        {youtubeFeeds.length}
                      </Badge>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform duration-200",
                          openCategories.youtube && "rotate-180"
                        )}
                      />
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-1 pl-4 space-y-1">
                  <AnimatePresence>
                    {youtubeFeeds.map((feed, index) => (
                      <motion.div
                        key={`${feed.id}-youtube`}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                      >
                        <FeedItem
                          feed={feed}
                          isSelected={selectedFeed?.id === feed.id}
                          onClick={() => handleFeedSelect(feed)}
                          categoryType="youtube"
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});

// Feed öğesi alt bileşeni
const FeedItem = memo(function FeedItem({
  feed,
  isSelected,
  onClick,
  categoryType,
}) {
  const unreadCount = feed.unread_count || 0;
  const [iconUrl, setIconUrl] = useState(feed.icon || null);
  const [title, setTitle] = useState(feed.title || "");

  // YouTube kanalları için önbellekten bilgileri al
  useEffect(() => {
    if (feed.type === "youtube" && feed.url) {
      const fetchChannelInfo = async () => {
        try {
          // Kanal ID'sini URL'den çıkar
          const channelIdMatch = feed.url.match(/channel_id=([^&]+)/);
          if (channelIdMatch && channelIdMatch[1]) {
            const channelId = channelIdMatch[1];

            // Önbellekten veya API'den kanal bilgilerini al
            const channelInfo = await youtubeService.getChannelInfo(channelId);

            if (channelInfo) {
              // Eğer kanal ikonu yoksa, önbellekten al
              if (!feed.icon && channelInfo.thumbnail) {
                setIconUrl(channelInfo.thumbnail);
              }

              // Eğer başlık URL ise, gerçek başlığı göster
              if (
                (!feed.title || feed.title === feed.url) &&
                channelInfo.title
              ) {
                setTitle(channelInfo.title);
              }
            }
          }
        } catch (error) {
          console.error("Kanal bilgileri alınamadı:", error);
        }
      };

      fetchChannelInfo();
    }
  }, [feed]);

  return (
    <motion.div
      whileHover={{ scale: 1.01, x: 3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-2 px-2 py-2 h-auto text-sm rounded-md",
          isSelected && categoryType === "youtube"
            ? "bg-gradient-to-r from-red-500/10 to-transparent text-foreground"
            : isSelected
            ? "bg-gradient-to-r from-primary/10 to-transparent text-foreground"
            : "",
          categoryType === "youtube"
            ? "hover:bg-red-500/5"
            : "hover:bg-primary/5"
        )}
        onClick={() => onClick(feed)}
      >
        <div className="relative w-5 h-5 flex-shrink-0">
          {iconUrl ? (
            <div className="w-full h-full rounded-sm overflow-hidden">
              <Image
                src={iconUrl}
                alt=""
                width={20}
                height={20}
                className="w-full h-full object-contain"
              />
            </div>
          ) : feed.type === "youtube" ? (
            <Youtube className="w-full h-full text-red-500" />
          ) : (
            <Rss className="w-full h-full text-primary" />
          )}

          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />
          )}
        </div>

        <span className="truncate font-medium text-sm">{title}</span>

        {unreadCount > 0 && (
          <Badge
            variant="outline"
            className="ml-auto py-0 h-5 min-w-[1.2rem] bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>
    </motion.div>
  );
});
