"use client";

import { useState } from "react";
import { Server } from "lucide-react";
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
import { toast } from "sonner";

export function SyncButton({ onSync, isSyncing }) {
  const { t } = useLanguage();

  const handleSync = async () => {
    if (isSyncing) return;

    try {
      if (onSync) {
        await onSync();
      } else {
        // Fallback - özel prop sağlanmadıysa doğrudan API'yi çağır
        const response = await fetch("/api/feed-sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Feed senkronizasyon hatası");
        }

        toast.success(data.message || "Feed'ler başarıyla güncellendi");
      }
    } catch (error) {
      console.error("Feed senkronizasyon hatası:", error);
      toast.error(
        error.message || "Feed'ler senkronize edilirken bir hata oluştu"
      );
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 gap-1.5"
              onClick={handleSync}
              disabled={isSyncing}
            >
              <Server
                className={cn(
                  "h-4 w-4",
                  isSyncing && "animate-pulse text-primary"
                )}
              />
              <span className="hidden sm:inline text-sm">
                {t("feeds.sync") === "feeds.sync"
                  ? "Senkronize Et"
                  : t("feeds.sync")}
              </span>
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="flex flex-col">
            <p>
              {t("feeds.syncFeeds") === "feeds.syncFeeds"
                ? "Feed'leri Sunucuda Güncelle"
                : t("feeds.syncFeeds")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("feeds.syncDescription") === "feeds.syncDescription"
                ? "Kaynak sitelerden en güncel verileri alır"
                : t("feeds.syncDescription")}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
