"use client";

import { useState, useEffect } from "react";
import { RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFeedService } from "@/hooks/features/useFeedService";
import { formatRelativeDate } from "@/lib/utils";
import { useSettingsStore } from "@/store/useSettingsStore";

export function RefreshButton({
  onRefresh,
  lastRefreshTime: propLastRefreshTime,
  isSyncing,
  externalLink,
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { t, language } = useLanguage();
  const { lastRefreshTime: hookLastRefreshTime } = useFeedService();
  const [lastRefreshDisplay, setLastRefreshDisplay] = useState("");
  const { settings } = useSettingsStore();

 
  const lastRefreshTime = propLastRefreshTime || hookLastRefreshTime;

  //format last refresh time
  useEffect(() => {
    if (lastRefreshTime) {
      try {
        const lastRefreshDate = new Date(lastRefreshTime);
        const formattedTime = lastRefreshDate.toLocaleTimeString(language, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        const relativeTime = formatRelativeDate(lastRefreshTime, language, t);
        setLastRefreshDisplay(`${formattedTime} (${relativeTime})`);
      } catch (error) {
        console.error("Error formatting date:", error);
        setLastRefreshDisplay("");
      }
    }
  }, [lastRefreshTime, language, t]);

  const handleRefresh = async () => {
    if (isRefreshing || isSyncing) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // refresh or sync status animation
  const isProcessing = isRefreshing || isSyncing;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 gap-1.5"
              onClick={handleRefresh}
              disabled={isProcessing}
            >
              {externalLink ? (
                <ExternalLink className="h-4 w-4" />
              ) : (
                <RefreshCw
                  className={cn(
                    "h-4 w-4",
                    isProcessing && "animate-spin text-primary"
                  )}
                />
              )}
              <span className="hidden sm:inline text-sm">
                {externalLink ? t("feeds.openInNewTab") : t("feeds.refresh")}
              </span>
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="flex flex-col">
            {!externalLink ? (
              <>
                <p>{t("feeds.syncFeeds")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("feeds.syncDescription")}
                </p>
                {lastRefreshDisplay && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("time.lastRefresh")}: {lastRefreshDisplay}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {t("time.autoRefresh")}:{" "}
                  {settings.refreshInterval < 60
                    ? t("time.units.minutes", {
                        count: settings.refreshInterval,
                      })
                    : t("time.units.hours", {
                        count: settings.refreshInterval / 60,
                      })}
                </p>
              </>
            ) : (
              <p>{t("feeds.openInNewTab")}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
