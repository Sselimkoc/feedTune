"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import {
  PlusCircle,
  RefreshCw,
  Trash2,
  Search,
  RssIcon,
  Youtube,
  Newspaper,
  FilterIcon,
} from "lucide-react";
import { AddFeedDialog } from "@/components/features/feeds/dialogs/AddFeedDialog";

/**
 * Feed sayfası için sidebar bileşeni
 */
export function FeedSidebar({
  feeds = [],
  selectedFeedId = null,
  stats = {},
  onFeedSelect = () => {},
  onAddFeed = () => {},
  onRemoveFeed = () => {},
  onSyncFeeds = () => {},
}) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // State yönetimi
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddFeedDialogOpen, setIsAddFeedDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Aramalı ve filtrelenmiş feed listesi
  const filteredFeeds = useMemo(() => {
    if (!feeds || !Array.isArray(feeds)) return [];

    if (!searchQuery) return feeds;

    const lowerQuery = searchQuery.toLowerCase();
    return feeds.filter(
      (feed) =>
        feed.title.toLowerCase().includes(lowerQuery) ||
        feed.description?.toLowerCase().includes(lowerQuery) ||
        feed.type?.toLowerCase().includes(lowerQuery)
    );
  }, [feeds, searchQuery]);

  // Feed grupları (tip bazında)
  const feedGroups = useMemo(() => {
    if (!filteredFeeds.length) return {};

    return filteredFeeds.reduce((acc, feed) => {
      const type = feed.type || "other";
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(feed);
      return acc;
    }, {});
  }, [filteredFeeds]);

  // Feed ekleme işleyicisi
  const handleAddFeed = useCallback(
    async (feedData) => {
      try {
        await onAddFeed(feedData);
        setIsAddFeedDialogOpen(false);
        return true;
      } catch (error) {
        console.error("Feed eklenirken hata oluştu:", error);
        return false;
      }
    },
    [onAddFeed]
  );

  // Feed senkronizasyon işleyicisi
  const handleSyncFeeds = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onSyncFeeds();
    } catch (error) {
      console.error("Feed senkronizasyonu sırasında hata:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onSyncFeeds, isRefreshing]);

  // Animasyon varyantları
  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  // Feed başlığı ve simgesini oluşturan yardımcı fonksiyon
  const getFeedIcon = (type) => {
    switch (type) {
      case "youtube":
        return <Youtube size={16} className="text-red-500" />;
      case "rss":
        return <RssIcon size={16} className="text-blue-500" />;
      default:
        return <Newspaper size={16} className="text-muted-foreground" />;
    }
  };

  // Feed grubu başlığı
  const getGroupTitle = (type) => {
    switch (type) {
      case "youtube":
        return t("feeds.youtubeFeeds");
      case "rss":
        return t("feeds.rssFeeds");
      default:
        return t("feeds.otherFeeds");
    }
  };

  // Feed yönetim komponentleri
  const getSidebarHeader = () => (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("feeds.yourFeeds")}</h2>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={handleSyncFeeds}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span className="sr-only">{t("feeds.syncFeeds")}</span>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("feeds.searchFeeds")}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          size="sm"
          className="shrink-0"
          onClick={() => setIsAddFeedDialogOpen(true)}
        >
          <PlusCircle className="mr-1 h-4 w-4" />
          <span>{t("feeds.add")}</span>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedFeedId === null ? "secondary" : "outline"}
          size="sm"
          onClick={() => onFeedSelect(null)}
          className="flex items-center gap-1"
        >
          <Newspaper className="h-4 w-4" />
          {t("feeds.allFeeds")}
          {stats.totalItems > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-2">
              {stats.totalItems}
            </Badge>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {}} // TODO: Filtreleme işlevselliği gelecekte eklenebilir
          className="flex items-center gap-1"
        >
          <FilterIcon className="h-4 w-4" />
          {t("feeds.filters")}
        </Button>
      </div>

      <Separator />
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {getSidebarHeader()}

      <ScrollArea className="flex-1 pr-3">
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* Feed Grupları */}
          {Object.entries(feedGroups).map(([type, feeds]) => (
            <div key={type} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {getGroupTitle(type)}
              </h3>

              {feeds.map((feed) => (
                <motion.div key={feed.id} variants={itemVariants}>
                  <Button
                    variant={selectedFeedId === feed.id ? "secondary" : "ghost"}
                    size="sm"
                    className={`w-full justify-start ${
                      selectedFeedId === feed.id ? "font-medium" : "font-normal"
                    }`}
                    onClick={() => onFeedSelect(feed.id)}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        {getFeedIcon(feed.type)}
                        <span className="truncate">{feed.title}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {feed.unread_count > 0 && (
                          <Badge variant="outline" className="h-5 px-2">
                            {feed.unread_count}
                          </Badge>
                        )}

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFeed(feed.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="sr-only">{t("feeds.remove")}</span>
                        </Button>
                      </div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          ))}

          {/* Boş durum */}
          {filteredFeeds.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {searchQuery ? t("feeds.noSearchResults") : t("feeds.noFeeds")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddFeedDialogOpen(true)}
              >
                <PlusCircle className="mr-1 h-4 w-4" />
                {t("feeds.addFeed")}
              </Button>
            </div>
          )}
        </motion.div>
      </ScrollArea>

      {/* Feed ekleme diyaloğu */}
      <AddFeedDialog
        isOpen={isAddFeedDialogOpen}
        onOpenChange={setIsAddFeedDialogOpen}
        onSubmit={handleAddFeed}
      />
    </div>
  );
}
