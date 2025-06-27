"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/core/ui/button";
import { ScrollArea } from "@/components/core/ui/scroll-area";
import { Badge } from "@/components/core/ui/badge";
import { Separator } from "@/components/core/ui/separator";
import { Input } from "@/components/core/ui/input";
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
  Plus,
  X,
} from "lucide-react";
import { AddFeedDialog } from "@/components/features/feed/dialogs/AddFeedDialog";
import { AddFeedButton } from "@/components/features/feed/buttons/AddFeedButton";
import { useAddFeed } from "@/hooks/features/feed-screen/useAddFeed";
import Link from "next/link";

/**
 * Feed sayfası için sidebar bileşeni
 */
export function FeedSidebar({
  feeds = [],
  selectedFeedIds = [],
  activeFilters = [],
  searchQuery = "",
  statistics = {},
  onSelectFeed = () => {},
  onToggleFilter = () => {},
  onSearchChange = () => {},
  onClearFilters = () => {},
}) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const { isDialogOpen, openAddFeedDialog, closeAddFeedDialog } = useAddFeed();

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
        await onSelectFeed([feedData.id]);
        closeAddFeedDialog();
        return true;
      } catch (error) {
        console.error("Feed eklenirken hata oluştu:", error);
        return false;
      }
    },
    [onSelectFeed, closeAddFeedDialog]
  );

  // Feed senkronizasyon işleyicisi
  const handleSyncFeeds = useCallback(async () => {
    await onSelectFeed(feeds.map((feed) => feed.id));
  }, [onSelectFeed, feeds]);

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

  const handleSearch = (e) => {
    onSearchChange(e.target.value);
  };

  const handleClearSearch = () => {
    onSearchChange("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("feeds.search")}
          value={searchQuery}
          onChange={handleSearch}
          className="pl-8"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-7 w-7"
            onClick={handleClearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Add Feed Button */}
      <div className="mb-4">
        <AddFeedButton onAddFeed={openAddFeedDialog} />
      </div>

      <Separator className="mb-4" />

      {/* Statistics */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("feeds.totalFeeds")}</span>
          <span className="font-medium">{statistics.totalFeeds}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t("feeds.unreadItems")}
          </span>
          <span className="font-medium">{statistics.unreadItems}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("feeds.favorites")}</span>
          <span className="font-medium">{statistics.favorites}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("feeds.readLater")}</span>
          <span className="font-medium">{statistics.readLater}</span>
        </div>
      </div>

      <Separator className="mb-4" />

      {/* Feed List */}
      <ScrollArea className="flex-1">
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
                    variant={
                      selectedFeedIds.includes(feed.id) ? "secondary" : "ghost"
                    }
                    size="sm"
                    className={`w-full justify-start ${
                      selectedFeedIds.includes(feed.id)
                        ? "font-medium"
                        : "font-normal"
                    }`}
                    onClick={() => onSelectFeed([feed.id])}
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
                            onSelectFeed([feed.id]);
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
              <Button variant="outline" size="sm" onClick={openAddFeedDialog}>
                <PlusCircle className="mr-1 h-4 w-4" />
                {t("feeds.addFeed")}
              </Button>
            </div>
          )}
        </motion.div>
      </ScrollArea>

      {/* Feed ekleme diyaloğu */}
      <AddFeedDialog isOpen={isDialogOpen} onOpenChange={closeAddFeedDialog} />
    </div>
  );
}
