"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { Filter, X, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export function FilterDialog({
  open,
  onOpenChange,
  onApplyFilters,
  onResetFilters,
  activeFilter,
  filters = {},
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

  // Filtre değişikliklerini kaydet
  const handleApplyFilters = () => {
    if (onApplyFilters) {
      onApplyFilters(localFilters);
    }
    onOpenChange(false);
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

  // Sıralama değişikliği
  const handleSortByChange = (value) => {
    setLocalFilters((prev) => ({ ...prev, sortBy: value }));
  };

  // Okuma durumu değişikliği
  const handleReadStatusChange = (key, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Feed türü değişikliği
  const handleFeedTypeChange = (key, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      feedTypes: { ...prev.feedTypes, [key]: value },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t("feeds.filterTitle") || "İçerikleri Filtrele"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 py-4">
            {/* Sıralama Seçimi */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {t("feeds.filterSortBy") || "Sıralama"}
              </h3>
              <Tabs
                value={localFilters.sortBy}
                onValueChange={handleSortByChange}
                className="w-full"
              >
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="newest">
                    {t("feeds.filterNewest") || "En Yeni"}
                  </TabsTrigger>
                  <TabsTrigger value="oldest">
                    {t("feeds.filterOldest") || "En Eski"}
                  </TabsTrigger>
                  <TabsTrigger value="unread">
                    {t("feeds.filterUnread") || "Okunmamış"}
                  </TabsTrigger>
                  <TabsTrigger value="favorites">
                    {t("feeds.filterFavorites") || "Favoriler"}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Separator />

            {/* Okuma Durumu */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {t("feeds.filterReadStatus") || "Okuma Durumu"}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-read"
                    checked={localFilters.showRead}
                    onCheckedChange={(checked) =>
                      handleReadStatusChange("showRead", checked)
                    }
                  />
                  <label
                    htmlFor="show-read"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t("feeds.filterShowRead") || "Okunmuş İçerikleri Göster"}
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-unread"
                    checked={localFilters.showUnread}
                    onCheckedChange={(checked) =>
                      handleReadStatusChange("showUnread", checked)
                    }
                  />
                  <label
                    htmlFor="show-unread"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t("feeds.filterShowUnread") ||
                      "Okunmamış İçerikleri Göster"}
                  </label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Feed Türleri */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {t("feeds.filterFeedTypes") || "Feed Türleri"}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-rss"
                    checked={localFilters.feedTypes.rss}
                    onCheckedChange={(checked) =>
                      handleFeedTypeChange("rss", checked)
                    }
                  />
                  <label
                    htmlFor="show-rss"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t("feeds.filterShowRSS") || "RSS İçeriklerini Göster"}
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-youtube"
                    checked={localFilters.feedTypes.youtube}
                    onCheckedChange={(checked) =>
                      handleFeedTypeChange("youtube", checked)
                    }
                  />
                  <label
                    htmlFor="show-youtube"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t("feeds.filterShowYouTube") ||
                      "YouTube İçeriklerini Göster"}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="mr-auto"
          >
            <X className="h-4 w-4 mr-2" />
            {t("feeds.filterReset") || "Sıfırla"}
          </Button>
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              {t("common.cancel") || "İptal"}
            </Button>
          </DialogClose>
          <Button size="sm" onClick={handleApplyFilters}>
            <Check className="h-4 w-4 mr-2" />
            {t("feeds.filterApply") || "Uygula"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
