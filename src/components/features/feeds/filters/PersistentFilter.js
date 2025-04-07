"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Filter,
  ChevronUp,
  ChevronDown,
  Calendar,
  CalendarDays,
  EyeOff,
  Bookmark,
  RefreshCw,
  Rss,
  Youtube,
  ArrowCounterClockwise,
  ArrowDownAZ,
  ArrowUpAZ,
  Mail,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

export function PersistentFilter({
  filters = {},
  onApplyFilters,
  onResetFilters,
  collapsed = false,
  onToggleCollapse,
  stats = {},
}) {
  const { t } = useLanguage();
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

  // İlk render sırasında veya prop değiştiğinde filtreleri güncelle
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

  // Filtre değişikliklerinin otomatik uygulanmasını kaldırıyoruz
  // 🚫 Bu kısım sonsuz döngüye neden oluyordu
  /*
  useEffect(() => {
    if (onApplyFilters) {
      onApplyFilters(localFilters);
    }
  }, [localFilters, onApplyFilters]);
  */

  // Filtreleri manuel olarak uygulamak için debounced fonksiyon
  useEffect(() => {
    // İlk render'da çalışmasın
    if (filters && Object.keys(filters).length > 0) {
      const timer = setTimeout(() => {
        if (onApplyFilters) {
          onApplyFilters(localFilters);
        }
      }, 300); // 300ms debounce süresi

      return () => clearTimeout(timer);
    }
  }, [localFilters, onApplyFilters]);

  // Sıralama değişikliği
  const handleSortByChange = (value) => {
    setLocalFilters((prev) => ({ ...prev, sortBy: value }));
  };

  // Okuma durumu değişikliği
  const handleReadStatusChange = (key, checked) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  // Feed türü değişikliği
  const handleFeedTypeChange = (key, checked) => {
    setLocalFilters((prev) => ({
      ...prev,
      feedTypes: { ...prev.feedTypes, [key]: checked },
    }));
  };

  // Filtreleri sıfırla
  const handleResetFilters = () => {
    const defaultFilters = {
      sortBy: "newest",
      showRead: true,
      showUnread: true,
      feedTypes: {
        rss: true,
        youtube: true,
      },
    };

    setLocalFilters(defaultFilters);

    if (onResetFilters) {
      onResetFilters();
    }
  };

  return (
    <Card className="border-b shadow-sm sticky top-0 z-20 mb-4 backdrop-blur-sm bg-background/95">
      <CardContent className="p-0">
        {/* Başlık ve Aç/Kapa Düğmesi */}
        <div className="mb-4 flex justify-between items-center px-2">
          <h3 className="text-base font-semibold tracking-tight">
            {t("feeds.filterTitle")}
          </h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={handleResetFilters}
            >
              <ArrowCounterClockwise className="h-4 w-4 mr-1" />
              {t("feeds.resetFilters")}
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ChevronUp
                  className={cn("h-4 w-4", collapsed && "rotate-180")}
                />
                <span className="sr-only">
                  {collapsed ? t("feeds.expand") : t("feeds.collapse")}
                </span>
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent className="space-y-4">
          {/* Sıralama */}
          <div>
            <h4 className="text-sm font-medium px-2 mb-1">
              {t("feeds.sortBy")}
            </h4>
            <div className="grid grid-cols-1 gap-1 px-1">
              <Button
                variant={filters.sortBy === "newest" ? "secondary" : "ghost"}
                size="sm"
                className="justify-start h-9"
                onClick={() => handleSortByChange("newest")}
              >
                <ArrowDownAZ className="mr-2 h-4 w-4" />
                {t("feeds.newest")}
              </Button>

              <Button
                variant={filters.sortBy === "oldest" ? "secondary" : "ghost"}
                size="sm"
                className="justify-start h-9"
                onClick={() => handleSortByChange("oldest")}
              >
                <ArrowUpAZ className="mr-2 h-4 w-4" />
                {t("feeds.oldest")}
              </Button>

              <Button
                variant={filters.sortBy === "unread" ? "secondary" : "ghost"}
                size="sm"
                className="justify-start h-9"
                onClick={() => handleSortByChange("unread")}
              >
                <Mail className="mr-2 h-4 w-4" />
                {t("feeds.unreadFeeds")}
              </Button>

              <Button
                variant={filters.sortBy === "favorites" ? "secondary" : "ghost"}
                size="sm"
                className="justify-start h-9"
                onClick={() => handleSortByChange("favorites")}
              >
                <Star className="mr-2 h-4 w-4" />
                {t("feeds.favorites")}
              </Button>
            </div>
          </div>

          {/* Okuma Durumu */}
          <div>
            <h4 className="text-sm font-medium px-2 mb-1">
              {t("feeds.readStatus")}
            </h4>
            <div className="px-2 space-y-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-read"
                  checked={filters.showRead}
                  onCheckedChange={(checked) =>
                    handleReadStatusChange("showRead", checked)
                  }
                />
                <label
                  htmlFor="show-read"
                  className="text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("feeds.showRead")}
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-unread"
                  checked={filters.showUnread}
                  onCheckedChange={(checked) =>
                    handleReadStatusChange("showUnread", checked)
                  }
                />
                <label
                  htmlFor="show-unread"
                  className="text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("feeds.showUnread")}
                </label>
              </div>
            </div>
          </div>

          {/* Feed Türleri */}
          <div>
            <h4 className="text-sm font-medium px-2 mb-1">
              {t("feeds.feedTypes")}
            </h4>
            <div className="px-2 space-y-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feed-type-rss"
                  checked={filters.feedTypes?.rss}
                  onCheckedChange={(checked) =>
                    handleFeedTypeChange("rss", checked)
                  }
                />
                <label
                  htmlFor="feed-type-rss"
                  className="text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("feeds.rssItems")}
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feed-type-youtube"
                  checked={filters.feedTypes?.youtube}
                  onCheckedChange={(checked) =>
                    handleFeedTypeChange("youtube", checked)
                  }
                />
                <label
                  htmlFor="feed-type-youtube"
                  className="text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("feeds.youtubeItems")}
                </label>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </CardContent>
    </Card>
  );
}
