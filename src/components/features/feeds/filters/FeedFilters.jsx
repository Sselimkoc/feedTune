import { memo, useCallback, useMemo } from "react";
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

  // Aktif filtreleri göster
  const activeFilters = useMemo(() => {
    const result = [];

    // Feed türü filtresi
    if (filters.feedType && filters.feedType !== "all") {
      result.push({
        key: "feedType",
        value: filters.feedType,
        label: filters.feedType === "youtube" ? "YouTube" : "RSS",
        icon:
          filters.feedType === "youtube" ? (
            <Youtube className="h-3 w-3" />
          ) : (
            <Rss className="h-3 w-3" />
          ),
      });
    }

    // Okunma durumu filtresi
    if (filters.readStatus) {
      result.push({
        key: "readStatus",
        value: filters.readStatus,
        label:
          filters.readStatus === "read" ? t("feeds.read") : t("feeds.unread"),
        icon:
          filters.readStatus === "read" ? (
            <BookCheck className="h-3 w-3" />
          ) : (
            <CircleSlash className="h-3 w-3" />
          ),
      });
    }

    // Sıralama filtresi
    if (filters.sortBy && filters.sortBy !== "newest") {
      const sortLabels = {
        oldest: t("feeds.oldest"),
        unread: t("feeds.unreadFirst"),
        favorites: t("feeds.favorites"),
      };

      const sortIcons = {
        oldest: <Clock className="h-3 w-3" />,
        unread: <CircleSlash className="h-3 w-3" />,
        favorites: <Star className="h-3 w-3" />,
      };

      result.push({
        key: "sortBy",
        value: filters.sortBy,
        label: sortLabels[filters.sortBy] || filters.sortBy,
        icon: sortIcons[filters.sortBy],
      });
    }

    return result;
  }, [filters, t]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-8 w-8 border-dashed",
                    isRefreshing && "animate-spin"
                  )}
                  disabled={disabled || isRefreshing}
                  onClick={onRefresh}
                  aria-label={t("feeds.refreshFeed")}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("feeds.refreshFeed")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewAs === "grid" ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8 rounded-r-none"
                    disabled={disabled}
                    onClick={() => handleViewChange("grid")}
                    aria-label={t("feeds.gridView")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("feeds.gridView")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewAs === "list" ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8 rounded-l-none"
                    disabled={disabled}
                    onClick={() => handleViewChange("list")}
                    aria-label={t("feeds.listView")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("feeds.listView")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={filters.feedType === "rss" ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-3"
                  disabled={disabled}
                  onClick={() =>
                    handleTypeFilterChange(
                      filters.feedType === "rss" ? "all" : "rss"
                    )
                  }
                  aria-label={t("feeds.filterRss")}
                >
                  <Rss className="h-4 w-4 mr-1.5" />
                  <span>RSS</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("feeds.filterRss")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={
                    filters.feedType === "youtube" ? "default" : "outline"
                  }
                  size="sm"
                  className="h-8 px-3"
                  disabled={disabled}
                  onClick={() =>
                    handleTypeFilterChange(
                      filters.feedType === "youtube" ? "all" : "youtube"
                    )
                  }
                  aria-label={t("feeds.filterYoutube")}
                >
                  <Youtube className="h-4 w-4 mr-1.5" />
                  <span>YouTube</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("feeds.filterYoutube")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={
                    filters.readStatus === "unread" ? "default" : "outline"
                  }
                  size="sm"
                  className="h-8 px-3"
                  disabled={disabled}
                  onClick={() =>
                    handleReadStatusChange(
                      filters.readStatus === "unread" ? null : "unread"
                    )
                  }
                  aria-label={t("feeds.filterUnread")}
                >
                  <CircleSlash className="h-4 w-4 mr-1.5" />
                  <span>{t("feeds.unread")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("feeds.filterUnread")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

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
        </div>
      </div>

      {/* Aktif filtreler badges */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-in fade-in-50 duration-300">
          {activeFilters.map((filter) => (
            <Badge
              key={`${filter.key}-${filter.value}`}
              variant="outline"
              className="flex items-center gap-1 bg-muted/50 hover:bg-muted transition-colors px-2 py-1 h-6"
              onClick={() => {
                // Filtreyi kaldır
                if (filter.key === "feedType") {
                  handleTypeFilterChange("all");
                } else if (filter.key === "readStatus") {
                  handleReadStatusChange(null);
                } else if (filter.key === "sortBy") {
                  handleSortChange("newest");
                }
              }}
            >
              {filter.icon}
              <span className="text-xs">{filter.label}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1 hover:bg-background/20"
                aria-label={`${t("common.remove")} ${filter.label}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18"></path>
                  <path d="M6 6l12 12"></path>
                </svg>
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
});
