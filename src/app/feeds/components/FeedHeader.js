"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AddFeedButton } from "@/components/features/feeds/buttons/AddFeedButton";
import { RefreshButton } from "@/components/features/feeds/buttons/RefreshButton";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Bookmark,
  BookmarkCheck,
  Eye,
  EyeOff,
  Rss,
  Youtube,
  LayoutGrid,
  List,
  Filter,
  ChevronUp,
  ChevronDown,
  Keyboard,
  Search,
  Plus,
  SlidersHorizontal,
  Check,
  RotateCcw,
  MailCheck,
  StarIcon,
  ClockIcon,
  InboxIcon,
  LayoutDashboard,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function FeedHeader({
  selectedFeed,
  feedType,
  itemCount = 0,
  unreadCount = 0,
  onRefresh,
  viewMode,
  onViewModeChange,
  onShowKeyboardShortcuts,
  onAddFeed,
  isSyncing,
  onSearch,
  searchQuery = "",
  filters = {},
  applyFilters,
  resetFilters,
  stats = {},
}) {
  const { t } = useLanguage();
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [localFilters, setLocalFilters] = useState({
    sortBy: filters.sortBy || "newest",
    showRead: filters.showRead !== undefined ? filters.showRead : true,
    showUnread: filters.showUnread !== undefined ? filters.showUnread : true,
    feedTypes: {
      rss: filters.feedTypes?.rss !== undefined ? filters.feedTypes.rss : true,
      youtube:
        filters.feedTypes?.youtube !== undefined
          ? filters.feedTypes.youtube
          : true,
    },
  });

  // Refresh zamanını takip et
  useEffect(() => {
    setLastRefreshTime(new Date());
  }, [onRefresh]);

  // Filters değiştiğinde localFilters'i güncelle
  useEffect(() => {
    if (filters && Object.keys(filters).length > 0) {
      setLocalFilters({
        sortBy: filters.sortBy || "newest",
        showRead: filters.showRead !== undefined ? filters.showRead : true,
        showUnread:
          filters.showUnread !== undefined ? filters.showUnread : true,
        feedTypes: {
          rss:
            filters.feedTypes?.rss !== undefined ? filters.feedTypes.rss : true,
          youtube:
            filters.feedTypes?.youtube !== undefined
              ? filters.feedTypes.youtube
              : true,
        },
      });
    }
  }, [filters]);

  // İçerik başlığını belirleme
  const determineTitle = () => {
    if (selectedFeed && feedType === "feed") {
      return selectedFeed.title || "";
    }

    if (feedType === "filter") {
      switch (selectedFeed) {
        case "filter:unread":
          return t("feeds.unreadFeeds");
        case "filter:favorites":
          return t("feeds.favorites");
        case "filter:readLater":
          return t("feeds.readLater");
        case "filter:read":
          return t("feeds.readFeeds");
        default:
          return t("feeds.allFeeds");
      }
    }

    return "";
  };

  // İçerik için ikon seçimi
  const determineIcon = () => {
    if (selectedFeed && feedType === "feed") {
      // RSS veya YouTube gösterimini ayarla
      if (selectedFeed.type === "rss") {
        return <Rss className="h-5 w-5 text-orange-500" />;
      } else if (selectedFeed.type === "youtube") {
        return <Youtube className="h-5 w-5 text-red-500" />;
      }
    }

    if (feedType === "filter") {
      switch (selectedFeed) {
        case "filter:unread":
          return <MailCheck className="h-5 w-5 text-primary" />;
        case "filter:favorites":
          return <StarIcon className="h-5 w-5 text-yellow-500" />;
        case "filter:readLater":
          return <ClockIcon className="h-5 w-5 text-blue-500" />;
        case "filter:read":
          return <InboxIcon className="h-5 w-5 text-slate-500" />;
        default:
          return <LayoutDashboard className="h-5 w-5 text-primary" />;
      }
    }

    return <LayoutDashboard className="h-5 w-5 text-primary" />;
  };

  // Sıralama değiştiğinde
  const handleSortByChange = (value) => {
    const newFilters = { ...localFilters, sortBy: value };
    setLocalFilters(newFilters);
    if (applyFilters) applyFilters(newFilters);
  };

  // Okuma durumu değiştiğinde
  const handleReadStatusChange = (key, checked) => {
    const newFilters = { ...localFilters, [key]: checked };
    setLocalFilters(newFilters);
    if (applyFilters) applyFilters(newFilters);
  };

  // Feed türü değiştiğinde
  const handleFeedTypeChange = (key, checked) => {
    const newFilters = {
      ...localFilters,
      feedTypes: { ...localFilters.feedTypes, [key]: checked },
    };
    setLocalFilters(newFilters);
    if (applyFilters) applyFilters(newFilters);
  };

  // Filtreleri sıfırla
  const handleResetFilters = () => {
    if (resetFilters) resetFilters();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full sticky top-0 z-30 bg-background/95 backdrop-blur-sm"
    >
      <Card className="border-b shadow-md rounded-lg mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Feed Başlığı */}
            <div className="flex items-center gap-2">
              {determineIcon()}
              <h1 className="text-xl font-bold truncate">{determineTitle()}</h1>
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-medium bg-blue-500 text-white px-2 py-0.5 rounded-full">
                  {unreadCount} {t("feeds.unread")}
                </span>
              )}
            </div>

            {/* Eylemler */}
            <div className="flex items-center gap-2">
              {/* Arama Input'u */}
              <div className="relative hidden md:block">
                <Search className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t("feeds.searchContent")}
                  value={searchQuery}
                  onChange={(e) => {
                    onSearch(e.target.value);
                  }}
                  className="w-[180px] h-9 pl-9 text-sm"
                />
              </div>

              {/* Filtreleme Düğmesi */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 relative"
                      onClick={() => {
                        if (onShowKeyboardShortcuts) onShowKeyboardShortcuts();
                      }}
                    >
                      <Filter className="h-4 w-4 mr-1" />
                      <span>{t("feeds.filters")}</span>
                      {(!localFilters.showRead ||
                        !localFilters.showUnread ||
                        !localFilters.feedTypes.rss ||
                        !localFilters.feedTypes.youtube) && (
                        <span className="absolute h-2 w-2 rounded-full bg-primary top-1 right-1"></span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{t("feeds.filterFeeds")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Yenileme Düğmesi */}
              <RefreshButton
                onRefresh={onRefresh}
                lastRefreshTime={lastRefreshTime}
                isSyncing={isSyncing}
              />

              {/* Klavye Kısayolları Düğmesi */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={onShowKeyboardShortcuts}
                    >
                      <Keyboard className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{t("feeds.keyboardShortcuts")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Feed Ekleme Düğmesi */}
              <AddFeedButton onAddFeed={onAddFeed} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
