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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { ArrowDownAZ, ArrowUpAZ, Filter, RefreshCw, Star } from "lucide-react";

export function FilterDialog({
  isOpen,
  onOpenChange,
  filters,
  onApplyFilters,
}) {
  const { t } = useLanguage();
  const [localFilters, setLocalFilters] = useState({ ...filters });

  // Filtreleri başlangıçta ve değiştiğinde güncelle
  useEffect(() => {
    if (filters) {
      setLocalFilters({ ...filters });
    }
  }, [filters]);

  // Filtreleri uygula
  const handleApplyFilters = () => {
    onApplyFilters(localFilters);
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
    onApplyFilters(defaultFilters);
    onOpenChange(false);
  };

  // Değerleri güncelle
  const handleSortByChange = (value) => {
    setLocalFilters((prev) => ({ ...prev, sortBy: value }));
  };

  const handleReadStatusChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleFeedTypeChange = (key, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      feedTypes: {
        ...prev.feedTypes,
        [key]: value,
      },
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t("feeds.filterTitle") || "Filtreler"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Sıralama seçenekleri */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              {t("feeds.sortBy") || "Sıralama"}
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={
                  localFilters.sortBy === "newest" ? "default" : "outline"
                }
                size="sm"
                className="justify-start"
                onClick={() => handleSortByChange("newest")}
              >
                <ArrowDownAZ className="mr-2 h-4 w-4" />
                {t("feeds.newest") || "En Yeni"}
              </Button>

              <Button
                variant={
                  localFilters.sortBy === "oldest" ? "default" : "outline"
                }
                size="sm"
                className="justify-start"
                onClick={() => handleSortByChange("oldest")}
              >
                <ArrowUpAZ className="mr-2 h-4 w-4" />
                {t("feeds.oldest") || "En Eski"}
              </Button>

              <Button
                variant={
                  localFilters.sortBy === "unread" ? "default" : "outline"
                }
                size="sm"
                className="justify-start"
                onClick={() => handleSortByChange("unread")}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("feeds.unreadFeeds") || "Okunmamış Beslemeler"}
              </Button>

              <Button
                variant={
                  localFilters.sortBy === "favorites" ? "default" : "outline"
                }
                size="sm"
                className="justify-start"
                onClick={() => handleSortByChange("favorites")}
              >
                <Star className="mr-2 h-4 w-4" />
                {t("feeds.favorites") || "Favoriler"}
              </Button>
            </div>
          </div>

          {/* Okuma durumu */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              {t("feeds.readStatus") || "Okuma Durumu"}
            </h4>

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
                  {t("feeds.showRead") || "Okunmuşları Göster"}
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
                  {t("feeds.showUnread") || "Okunmamışları Göster"}
                </label>
              </div>
            </div>
          </div>

          {/* Feed tipleri */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              {t("feeds.feedTypes") || "Besleme Türleri"}
            </h4>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feed-type-rss"
                  checked={localFilters.feedTypes.rss}
                  onCheckedChange={(checked) =>
                    handleFeedTypeChange("rss", checked)
                  }
                />
                <label
                  htmlFor="feed-type-rss"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  RSS
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feed-type-youtube"
                  checked={localFilters.feedTypes.youtube}
                  onCheckedChange={(checked) =>
                    handleFeedTypeChange("youtube", checked)
                  }
                />
                <label
                  htmlFor="feed-type-youtube"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  YouTube
                </label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleResetFilters}>
            {t("feeds.resetFilters") || "Filtreleri Sıfırla"}
          </Button>
          <Button onClick={handleApplyFilters}>
            {t("feeds.applyFilters") || "Filtreleri Uygula"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
