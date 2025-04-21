"use client";

import { useState } from "react";
import { Server, Youtube } from "lucide-react";
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

export function SyncButton({
  feedId,
  isSyncing = false,
  feedType,
  variant = "default",
}) {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const { syncYoutubeFeed } = useFeedService();

  const isYoutube = feedType === "youtube";

  const handleSync = async () => {
    if (isSyncing || isProcessing) return;
    if (!feedId) return;

    setIsProcessing(true);
    try {
      if (isYoutube) {
        await syncYoutubeFeed(feedId);
      } else {
        // RSS veya diğer feed tipleri için varsayılan senkronizasyon
        const response = await fetch("/api/feed-sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            feedId,
            type: feedType || "all",
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error);
        }
      }
    } catch (error) {
      console.error("Senkronizasyon hatası:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isSyncing || isProcessing;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={isYoutube ? "destructive" : "outline"}
              size="sm"
              className={cn(
                "h-9 px-3 gap-1.5",
                isYoutube && "bg-red-600 hover:bg-red-700 text-white"
              )}
              onClick={handleSync}
              disabled={isLoading || !feedId}
            >
              {isYoutube ? (
                <Youtube
                  className={cn("h-4 w-4", isLoading && "animate-pulse")}
                />
              ) : (
                <Server
                  className={cn(
                    "h-4 w-4",
                    isLoading && "animate-pulse text-primary"
                  )}
                />
              )}
              <span className="hidden sm:inline text-sm">
                {isYoutube ? t("feeds.syncYoutube") : t("feeds.sync")}
              </span>
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="flex flex-col">
            <p>
              {isYoutube ? t("feeds.syncYoutubeFeeds") : t("feeds.syncFeeds")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isYoutube
                ? t("feeds.syncYoutubeDescription")
                : t("feeds.syncDescription")}
            </p>
            {!feedId && (
              <p className="text-xs text-amber-500 mt-1">
                {t("feeds.selectFeedFirst")}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
