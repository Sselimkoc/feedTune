"use client";

import { useState } from "react";
import { Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

export function SyncButton({ onSync, isSyncing, feedType }) {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSync = async () => {
    if (isSyncing || isProcessing) return;

    setIsProcessing(true);
    try {
      if (onSync) {
        await onSync();
      } else {
        const response = await fetch("/api/feed-sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ type: feedType || "all" }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error);
        }

        toast.success(data.message);
      }
    } catch (error) {
      toast.error(error.message);
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
              variant="outline"
              size="sm"
              className="h-9 px-3 gap-1.5"
              onClick={handleSync}
              disabled={isLoading}
            >
              <Server
                className={cn(
                  "h-4 w-4",
                  isLoading && "animate-pulse text-primary"
                )}
              />
              <span className="hidden sm:inline text-sm">
                {t("feeds.sync")}
              </span>
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="flex flex-col">
            <p>{t("feeds.syncFeeds")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("feeds.syncDescription")}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
