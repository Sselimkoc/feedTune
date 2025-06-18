"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/core/ui/dialog";
import { Button } from "@/components/core/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/core/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/core/ui/form";
import { Checkbox } from "@/components/core/ui/checkbox";
import { useForm } from "react-hook-form";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import { ArrowDownAZ, ArrowUpAZ, Filter, RefreshCw, Star } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/core/ui/radio-group";
import { Label as UILabel } from "@/components/core/ui/label";
import { Rss, Youtube } from "lucide-react";

export function FilterDialog({
  open,
  onOpenChange,
  filters = {},
  onApplyFilters,
  onResetFilters,
  activeFilter,
}) {
  const { t } = useLanguage();
  const [localFilters, setLocalFilters] = useState({
    sortBy: "newest",
    readStatus: null,
    feedType: "all",
  });

  // Filtreleri başlangıçta ve değiştiğinde güncelle
  useEffect(() => {
    if (filters) {
      setLocalFilters({
        sortBy: filters.sortBy || "newest",
        readStatus: filters.readStatus || null,
        feedType: filters.feedType || "all",
      });
    }
  }, [filters, open]);

  // Filtreleri uygula
  const handleApplyFilters = () => {
    onApplyFilters(localFilters);
    onOpenChange(false);
  };

  // Filtreleri sıfırla
  const handleResetFilters = () => {
    const defaultFilters = {
      sortBy: "newest",
      readStatus: null,
      feedType: "all",
    };

    setLocalFilters(defaultFilters);
    if (onResetFilters) {
      onResetFilters();
    } else {
      onApplyFilters(defaultFilters);
    }
    onOpenChange(false);
  };

  // Değerleri güncelle
  const handleSortByChange = (value) => {
    setLocalFilters((prev) => ({ ...prev, sortBy: value }));
  };

  const handleReadStatusChange = (value) => {
    setLocalFilters((prev) => ({ ...prev, readStatus: value }));
  };

  const handleFeedTypeChange = (value) => {
    setLocalFilters((prev) => ({ ...prev, feedType: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">
            {t("feeds.filterTitle")}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleApplyFilters();
          }}
        >
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">{t("feeds.sortBy")}</h4>
              <RadioGroup
                value={localFilters.sortBy}
                onValueChange={handleSortByChange}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="newest" id="newest" />
                  <UILabel htmlFor="newest">{t("feeds.newest")}</UILabel>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="oldest" id="oldest" />
                  <UILabel htmlFor="oldest">{t("feeds.oldest")}</UILabel>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unread" id="unread-first" />
                  <UILabel htmlFor="unread-first">
                    {t("feeds.unreadFeeds")}
                  </UILabel>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="favorites" id="favorites" />
                  <UILabel htmlFor="favorites">{t("feeds.favorites")}</UILabel>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">{t("feeds.readStatus")}</h4>
              <RadioGroup
                value={localFilters.readStatus}
                onValueChange={handleReadStatusChange}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={null} id="show-all" />
                  <UILabel htmlFor="show-all">{t("feeds.all")}</UILabel>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="read" id="show-read" />
                  <UILabel htmlFor="show-read">{t("feeds.showRead")}</UILabel>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unread" id="show-unread" />
                  <UILabel htmlFor="show-unread">
                    {t("feeds.showUnread")}
                  </UILabel>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">{t("feeds.feedTypes")}</h4>
              <RadioGroup
                value={localFilters.feedType}
                onValueChange={handleFeedTypeChange}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="show-all-types" />
                  <UILabel htmlFor="show-all-types">{t("feeds.all")}</UILabel>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rss" id="show-rss" />
                  <UILabel htmlFor="show-rss" className="flex items-center">
                    <Rss className="mr-1 h-3.5 w-3.5 text-orange-500" />
                    <span>RSS</span>
                  </UILabel>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="youtube" id="show-youtube" />
                  <UILabel htmlFor="show-youtube" className="flex items-center">
                    <Youtube className="mr-1 h-3.5 w-3.5 text-red-500" />
                    <span>YouTube</span>
                  </UILabel>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              size="sm"
            >
              {t("common.reset")}
            </Button>
            <DialogClose asChild>
              <Button variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button type="submit">{t("common.apply")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
