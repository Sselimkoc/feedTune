import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutGrid,
  List,
  Filter,
  RefreshCw,
  Youtube,
  Rss,
  CircleSlash,
  BookCheck,
  Clock,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const FeedFilters = memo(function FeedFilters({
  filters = {},
  onFilterChange,
  onRefresh,
  onViewChange,
  viewAs = "grid",
  disabled = false,
  isRefreshing = false,
}) {
  const { t } = useLanguage();

  // Görünüm değiştirme
  const handleViewChange = useCallback(
    (view) => {
      onViewChange?.(view);
    },
    [onViewChange]
  );

  // Tür filtreleme (RSS, YouTube)
  const handleTypeFilterChange = useCallback(
    (type) => {
      onFilterChange?.({ ...filters, feedType: type });
    },
    [filters, onFilterChange]
  );

  // Okunma durumu filtreleme
  const handleReadStatusChange = useCallback(
    (status) => {
      onFilterChange?.({ ...filters, readStatus: status });
    },
    [filters, onFilterChange]
  );

  // Sıralama değiştirme
  const handleSortChange = useCallback(
    (sortBy) => {
      onFilterChange?.({ ...filters, sortBy });
    },
    [filters, onFilterChange]
  );

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-wrap justify-between items-center gap-2">
        {/* Sol kısım: Görünüm ve feed türü filtreleri */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Görünüm seçenekleri */}
          <div className="bg-muted/40 rounded-lg p-1 flex">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewAs === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => handleViewChange("grid")}
                    disabled={disabled}
                    className="h-8 w-8 rounded-md"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("feeds.gridView")}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewAs === "list" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => handleViewChange("list")}
                    disabled={disabled}
                    className="h-8 w-8 rounded-md"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("feeds.listView")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Feed türü butonları */}
          <div className="flex items-center gap-2 ml-2">
            <Button
              variant={
                !filters.feedType || filters.feedType === "all"
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => handleTypeFilterChange("all")}
              disabled={disabled}
              className={cn(
                "h-8 px-3 text-xs",
                !filters.feedType || filters.feedType === "all"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground"
              )}
            >
              <CircleSlash className="h-3.5 w-3.5 mr-1.5" />
              {t("feeds.all")}
            </Button>

            <Button
              variant={filters.feedType === "youtube" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTypeFilterChange("youtube")}
              disabled={disabled}
              className={cn(
                "h-8 px-3 text-xs",
                filters.feedType === "youtube"
                  ? "bg-red-600 hover:bg-red-700 text-white border-red-500"
                  : "border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              )}
            >
              <Youtube className="h-3.5 w-3.5 mr-1.5" />
              {t("feeds.youtube")}
            </Button>

            <Button
              variant={filters.feedType === "rss" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTypeFilterChange("rss")}
              disabled={disabled}
              className={cn(
                "h-8 px-3 text-xs",
                filters.feedType === "rss"
                  ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
                  : "border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
              )}
            >
              <Rss className="h-3.5 w-3.5 mr-1.5" />
              {t("feeds.rss")}
            </Button>
          </div>
        </div>

        {/* Sağ kısım: Sıralama ve yenileme */}
        <div className="flex items-center gap-2">
          {/* Sıralama dropdown */}
          <Select
            value={filters.sortBy || "newest"}
            onValueChange={handleSortChange}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder={t("feeds.sort")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <div className="flex items-center">
                  <Clock className="mr-2 h-3.5 w-3.5" />
                  <span>{t("feeds.newest")}</span>
                </div>
              </SelectItem>
              <SelectItem value="oldest">
                <div className="flex items-center">
                  <Clock className="mr-2 h-3.5 w-3.5" />
                  <span>{t("feeds.oldest")}</span>
                </div>
              </SelectItem>
              <SelectItem value="unread">
                <div className="flex items-center">
                  <BookCheck className="mr-2 h-3.5 w-3.5" />
                  <span>{t("feeds.unreadFirst")}</span>
                </div>
              </SelectItem>
              <SelectItem value="favorites">
                <div className="flex items-center">
                  <Star className="mr-2 h-3.5 w-3.5" />
                  <span>{t("feeds.favorites")}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Okunma durumu dropdown */}
          <Select
            value={filters.readStatus || "all"}
            onValueChange={handleReadStatusChange}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder={t("feeds.readStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center">
                  <CircleSlash className="mr-2 h-3.5 w-3.5" />
                  <span>{t("feeds.all")}</span>
                </div>
              </SelectItem>
              <SelectItem value="unread">
                <div className="flex items-center">
                  <Badge
                    variant="default"
                    className="mr-2 h-[6px] w-[6px] rounded-full p-0"
                  />
                  <span>{t("feeds.unread")}</span>
                </div>
              </SelectItem>
              <SelectItem value="read">
                <div className="flex items-center">
                  <BookCheck className="mr-2 h-3.5 w-3.5" />
                  <span>{t("feeds.read")}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Yenileme butonu */}
          {onRefresh && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onRefresh}
                    disabled={disabled || isRefreshing}
                    className="h-8 w-8"
                  >
                    <RefreshCw
                      className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("feeds.refresh")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
});
