"use client";

import { memo } from "react";
import { Card } from "@/components/ui/card";
import { ViewToggle } from "@/components/features/feeds/buttons/ViewToggle";
import { SyncButton } from "@/components/features/feeds/buttons/SyncButton";
import { FilterButton } from "@/components/features/feeds/buttons/FilterButton";
import { KeyboardButton } from "@/components/features/feeds/buttons/KeyboardButton";
import { AddFeedButton } from "@/components/features/feeds/buttons/AddFeedButton";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import { Rss, Youtube } from "lucide-react";

export const FeedHeader = memo(function FeedHeader({
  selectedFeed,
  onRefresh,
  viewMode,
  onViewModeChange,
  onOpenFilters,
  onShowKeyboardShortcuts,
  onAddFeed,
  filters,
  stats,
}) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="sticky top-0 z-50 w-full backdrop-blur-sm backdrop-saturate-150 bg-background/80"
    >
      <Card className="border-none shadow-none">
        <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold">
              {selectedFeed ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 flex-shrink-0">
                    {selectedFeed.icon ? (
                      <img
                        src={selectedFeed.icon}
                        alt=""
                        className="w-full h-full object-contain rounded-sm"
                      />
                    ) : selectedFeed.type === "youtube" ? (
                      <Youtube className="w-full h-full text-red-500" />
                    ) : (
                      <Rss className="w-full h-full text-primary" />
                    )}
                  </div>
                  <span>{selectedFeed.title}</span>
                </div>
              ) : (
                t("feeds.allFeeds")
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              {selectedFeed
                ? selectedFeed.description || t("feeds.noDescription")
                : t("feeds.allFeedsDescription")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AddFeedButton onAddFeed={onAddFeed} />
            <SyncButton onSync={onRefresh} />
            <ViewToggle
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
            />
            <FilterButton onOpenFilters={onOpenFilters} />
            <KeyboardButton onShowKeyboardShortcuts={onShowKeyboardShortcuts} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
});
