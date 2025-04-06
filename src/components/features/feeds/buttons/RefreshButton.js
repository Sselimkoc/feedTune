"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
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
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { useSettingsStore } from "@/store/useSettingsStore";

export function RefreshButton({
  onRefresh,
  lastRefreshTime: propLastRefreshTime,
  isSyncing,
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { t, language } = useLanguage();
  const { lastRefreshTime: hookLastRefreshTime } = useFeedService();
  const [lastRefreshDisplay, setLastRefreshDisplay] = useState("");
  const { settings } = useSettingsStore();

  // Prop olarak geçilmiş veya hook'tan alınmış son yenileme zamanını kullan
  const lastRefreshTime = propLastRefreshTime || hookLastRefreshTime;

  // Tarih biçimlendirmesi için locale seçimi
  const dateLocale = language === "tr" ? tr : enUS;

  // Son yenileme zamanını formatla
  useEffect(() => {
    if (lastRefreshTime) {
      try {
        const lastRefreshDate = new Date(lastRefreshTime);
        const formattedDate = format(lastRefreshDate, "HH:mm:ss", {
          locale: dateLocale,
        });

        // Şu anki zaman ile son yenileme arasındaki farkı hesapla (dakika cinsinden)
        const diffMinutes = Math.floor(
          (Date.now() - lastRefreshTime) / 1000 / 60
        );

        let timeAgoText = "";
        if (diffMinutes < 1) {
          timeAgoText = t("refreshButton.justNow");
        } else if (diffMinutes === 1) {
          timeAgoText = t("refreshButton.minuteAgo", { count: 1 });
        } else if (diffMinutes < 60) {
          timeAgoText = t("refreshButton.minutesAgo", { count: diffMinutes });
        } else {
          const diffHours = Math.floor(diffMinutes / 60);
          timeAgoText = t("refreshButton.hoursAgo", { count: diffHours });
        }

        setLastRefreshDisplay(`${formattedDate} (${timeAgoText})`);
      } catch (error) {
        console.error("Tarih formatlanırken hata oluştu:", error);
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

  // Yenileme veya senkronizasyon durumuna göre animasyon
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
              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  isProcessing && "animate-spin text-primary"
                )}
              />
              <span className="hidden sm:inline text-sm">
                {t("feeds.refresh") === "feeds.refresh"
                  ? "Yenile"
                  : t("feeds.refresh")}
              </span>
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="flex flex-col">
            <p>
              {t("feeds.syncFeeds") === "feeds.syncFeeds"
                ? "Beslemeleri Güncelle"
                : t("feeds.syncFeeds")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("feeds.syncDescription") === "feeds.syncDescription"
                ? "Kaynak sitelerden en güncel verileri alır"
                : t("feeds.syncDescription")}
            </p>
            {lastRefreshDisplay && (
              <p className="text-xs text-muted-foreground mt-1">
                {t("refreshButton.lastRefresh") === "refreshButton.lastRefresh"
                  ? "Son yenileme"
                  : t("refreshButton.lastRefresh")}
                : {lastRefreshDisplay}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {t("refreshButton.autoRefresh") === "refreshButton.autoRefresh"
                ? "Otomatik yenileme"
                : t("refreshButton.autoRefresh")}
              :{" "}
              {(() => {
                const minutes = settings.refreshInterval || 30;
                if (minutes < 60) {
                  return `${minutes} ${
                    t("settings.minutes") === "settings.minutes"
                      ? "dakika"
                      : t("settings.minutes")
                  }`;
                } else {
                  const hours = minutes / 60;
                  return `${hours} ${
                    t("settings.hours") === "settings.hours"
                      ? "saat"
                      : t("settings.hours")
                  }`;
                }
              })()}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
