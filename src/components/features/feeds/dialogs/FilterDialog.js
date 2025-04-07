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
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupValue,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Rss, Youtube } from "lucide-react";

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
          <DialogTitle className="text-lg font-medium">
            {t("feeds.filterTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleApplyFilters}>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">{t("feeds.sortBy")}</h4>
              <RadioGroup
                value={filters.sortBy || "newest"}
                onValueChange={handleSortByChange}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="newest" id="newest" />
                  <Label htmlFor="newest">{t("feeds.newest")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="oldest" id="oldest" />
                  <Label htmlFor="oldest">{t("feeds.oldest")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unread" id="unread-first" />
                  <Label htmlFor="unread-first">{t("feeds.unreadFeeds")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="favorites" id="favorites" />
                  <Label htmlFor="favorites">{t("feeds.favorites")}</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">{t("feeds.readStatus")}</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-read"
                    checked={filters.showRead}
                    onCheckedChange={(checked) =>
                      handleReadStatusChange("showRead", checked)
                    }
                  />
                  <Label htmlFor="show-read">{t("feeds.showRead")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-unread"
                    checked={filters.showUnread}
                    onCheckedChange={(checked) =>
                      handleReadStatusChange("showUnread", checked)
                    }
                  />
                  <Label htmlFor="show-unread">{t("feeds.showUnread")}</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">{t("feeds.feedTypes")}</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-rss"
                    checked={filters.feedTypes?.rss}
                    onCheckedChange={(checked) =>
                      handleFeedTypeChange("rss", checked)
                    }
                  />
                  <div className="grid gap-1">
                    <Label htmlFor="show-rss" className="flex items-center">
                      <Rss className="mr-1 h-3.5 w-3.5 text-orange-500" />
                      <span>RSS</span>
                    </Label>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-youtube"
                    checked={filters.feedTypes?.youtube}
                    onCheckedChange={(checked) =>
                      handleFeedTypeChange("youtube", checked)
                    }
                  />
                  <div className="grid gap-1">
                    <Label htmlFor="show-youtube" className="flex items-center">
                      <Youtube className="mr-1 h-3.5 w-3.5 text-red-500" />
                      <span>YouTube</span>
                    </Label>
                  </div>
                </div>
              </div>
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
