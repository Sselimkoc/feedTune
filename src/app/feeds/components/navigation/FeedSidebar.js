"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertOctagon,
  BookmarkCheck,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  EyeOff,
  Filter,
  HardDrive,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Rss,
  Search,
  Trash2,
  Youtube,
  X,
  ChevronsLeft,
  ChevronsRight,
  Archive,
  BookMarked,
  ChevronLeft,
  Home,
  MoreVertical,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export function FeedSidebar({
  feeds = [],
  selectedFeedId,
  onFeedSelect,
  onAddFeed,
  viewMode = "grid",
  onViewModeChange,
  onMarkAllRead,
  onRemoveFeed,
  activeFilter = "all",
  stats = {},
  isCollapsed = false,
  onToggleCollapse,
}) {
  const { t, language, changeLanguage } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({
    all: true,
    rss: true,
    youtube: true,
    unread: false,
    favorites: false,
    readLater: false,
  });

  // Feed türlerine göre gruplandırma
  const categorizedFeeds = useMemo(() => {
    const filtered = feeds.filter(
      (feed) =>
        feed.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feed.url?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return {
      all: filtered,
      rss: filtered.filter((feed) => feed.type === "rss"),
      youtube: filtered.filter((feed) => feed.type === "youtube"),
      unread: filtered.filter((feed) => {
        // Okunmamış öğesi olan feed'leri bul
        const unreadCount = feed.unreadCount || 0;
        return unreadCount > 0;
      }),
      favorites: filtered.filter((feed) => {
        // Favori öğesi olan feed'leri bul
        const favoriteCount = feed.favoriteCount || 0;
        return favoriteCount > 0;
      }),
      readLater: filtered.filter((feed) => {
        // Daha sonra okunacak öğesi olan feed'leri bul
        const readLaterCount = feed.readLaterCount || 0;
        return readLaterCount > 0;
      }),
    };
  }, [feeds, searchQuery]);

  // Kategori açılıp kapanma durumunu değiştir
  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Arama temizleme
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Feed öğesine tıklama - Memoize with useCallback
  const handleFeedClick = useCallback(
    (feedId) => {
      // Performans için hızlı kontrol
      if (selectedFeedId === feedId) return;

      // Feed ID'sini doğrudan kullan
      onFeedSelect && onFeedSelect(feedId);
    },
    [selectedFeedId, onFeedSelect]
  );

  // Filtre öğesine tıklama - Memoize with useCallback
  const handleFilterClick = useCallback(
    (filter) => {
      // Aktif filtre zaten seçiliyse işlem yapma (performans için)
      if (activeFilter === filter && !selectedFeedId) return;

      // Filter parametresi ile çağrı yapıyoruz
      if (typeof onFeedSelect === "function") {
        // Filtre tipine bağlı olarak doğru string'i oluştur
        const feedTypeFilterMap = {
          all: "filter:all",
          unread: "filter:unread",
          favorites: "filter:favorites",
          readLater: "filter:readLater",
          rss: "filter:rss",
          youtube: "filter:youtube",
        };

        // Önce kategorilerin açık olma durumlarını güncelle
        if (filter === "rss" && !expandedCategories.rss) {
          setExpandedCategories((prev) => ({ ...prev, rss: true }));
        } else if (filter === "youtube" && !expandedCategories.youtube) {
          setExpandedCategories((prev) => ({ ...prev, youtube: true }));
        }

        // Doğrudan filter:xxx formatında bir string gönder
        // Performans için, sadece gerekiyorsa yeni değer gönder
        const newFilterValue = feedTypeFilterMap[filter] || null;
        if (selectedFeedId !== newFilterValue) {
          onFeedSelect(newFilterValue);
        }
      }
    },
    [activeFilter, selectedFeedId, onFeedSelect, expandedCategories]
  );

  return (
    <div
      className={cn(
        "h-full transition-all duration-300 sticky top-0 overflow-hidden",
        isCollapsed ? "w-16 px-1 py-2" : "w-64 px-2 py-3"
      )}
    >
      {/* Daraltma/Genişletme Butonu */}
      <div className="flex justify-center mb-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleCollapse}
                className="w-full rounded-full hover:bg-accent transition-all duration-200 border-dashed"
              >
                <motion.div
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2"
                >
                  {isCollapsed ? (
                    <ChevronsRight className="h-5 w-5 text-primary" />
                  ) : (
                    <>
                      <ChevronsLeft className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium">
                        {t("feeds.sidebar.collapse")}
                      </span>
                    </>
                  )}
                </motion.div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>
                {isCollapsed
                  ? t("feeds.sidebar.expand")
                  : t("feeds.sidebar.collapse")}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <ScrollArea className="h-[calc(100vh-5rem)]">
        {!isCollapsed ? (
          <>
            {/* Arama */}
            <div className="relative mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("feeds.sidebar.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-8 h-9 text-sm"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={clearSearch}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* RSS Beslemeleri */}
            <Collapsible
              defaultOpen={expandedCategories.rss}
              onOpenChange={() => toggleCategory("rss")}
              className="mb-4"
            >
              <div className="flex items-center justify-between px-2 mb-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-2 -ml-2">
                    <div className="flex items-center">
                      {expandedCategories.rss ? (
                        <ChevronDown className="h-4 w-4 mr-1" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-1" />
                      )}
                      <h3 className="text-sm font-medium flex items-center gap-1">
                        <Rss className="h-4 w-4 text-orange-500" />
                        {t("feeds.sidebar.rssFeeds")}
                      </h3>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <Badge variant="outline" className="text-xs px-1.5">
                  {categorizedFeeds.rss.length}
                </Badge>
              </div>

              <CollapsibleContent>
                {categorizedFeeds.rss.length > 0 ? (
                  <div className="space-y-1 pl-6">
                    {categorizedFeeds.rss.map((feed) => (
                      <div
                        key={feed.id}
                        className="flex items-center justify-between group"
                      >
                        <Button
                          variant={
                            selectedFeedId === feed.id ? "default" : "ghost"
                          }
                          className={cn(
                            "h-8 w-full justify-start overflow-hidden text-xs",
                            selectedFeedId === feed.id ? "bg-accent" : ""
                          )}
                          onClick={() => handleFeedClick(feed.id)}
                        >
                          <div className="truncate">
                            {feed.title || feed.url}
                          </div>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => onRemoveFeed(feed.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>{t("feeds.sidebar.remove")}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2 px-4 text-sm text-muted-foreground">
                    {searchQuery
                      ? t("feeds.noSearchResults")
                      : t("feeds.noRssFeeds")}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* YouTube Kanalları */}
            <Collapsible
              defaultOpen={expandedCategories.youtube}
              onOpenChange={() => toggleCategory("youtube")}
            >
              <div className="flex items-center justify-between px-2 mb-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-2 -ml-2">
                    <div className="flex items-center">
                      {expandedCategories.youtube ? (
                        <ChevronDown className="h-4 w-4 mr-1" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-1" />
                      )}
                      <h3 className="text-sm font-medium flex items-center gap-1">
                        <Youtube className="h-4 w-4 text-red-500" />
                        {t("feeds.sidebar.youtubeFeeds")}
                      </h3>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <Badge variant="outline" className="text-xs px-1.5">
                  {categorizedFeeds.youtube.length}
                </Badge>
              </div>

              <CollapsibleContent>
                {categorizedFeeds.youtube.length > 0 ? (
                  <div className="space-y-1 pl-6">
                    {categorizedFeeds.youtube.map((feed) => (
                      <div
                        key={feed.id}
                        className="flex items-center justify-between group"
                      >
                        <Button
                          variant={
                            selectedFeedId === feed.id ? "default" : "ghost"
                          }
                          className={cn(
                            "h-8 w-full justify-start overflow-hidden text-xs",
                            selectedFeedId === feed.id ? "bg-accent" : ""
                          )}
                          onClick={() => handleFeedClick(feed.id)}
                        >
                          <div className="truncate">
                            {feed.title || feed.url}
                          </div>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => onRemoveFeed(feed.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>{t("feeds.sidebar.remove")}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2 px-4 text-sm text-muted-foreground">
                    {searchQuery
                      ? t("feeds.noSearchResults")
                      : t("feeds.noYoutubeFeeds")}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </>
        ) : (
          /* Daraltılmış mod - Sadece ikonları göster */
          <div className="flex flex-col items-center space-y-4 pt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeFilter === "all" ? "default" : "ghost"}
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => onFeedSelect("all")}
                  >
                    <Home className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>

                <TooltipContent side="right">
                  <p>{t("feeds.sidebar.rssFeeds")}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-red-500"
                    onClick={() => {}}
                  >
                    <Youtube className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{t("feeds.sidebar.youtubeFeeds")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
