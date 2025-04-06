"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AddFeedButton } from "@/components/features/feeds/buttons/AddFeedButton";
import { FeedSelector } from "./navigation/FeedSelector";
import { ViewToggle } from "@/components/features/feeds/buttons/ViewToggle";
import { FilterButton } from "@/components/features/feeds/buttons/FilterButton";
import { KeyboardButton } from "@/components/features/feeds/buttons/KeyboardButton";
import { RefreshButton } from "@/components/features/feeds/buttons/RefreshButton";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Bookmark,
  BookmarkCheck,
  Eye,
  EyeOff,
  Server,
  Stars,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function FeedHeader({
  feeds,
  selectedFeedId,
  onFeedSelect,
  onOpenFilters,
  onShowKeyboardShortcuts,
  onRefresh,
  viewMode,
  onViewModeChange,
  onAddFeed,
  onSync,
  isSyncing,
}) {
  const { t } = useLanguage();
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  // Refresh zamanını takip et
  useEffect(() => {
    setLastRefreshTime(new Date());
  }, [onRefresh]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full sticky top-0 z-10"
    >
      <Card className="border-b shadow-md rounded-none">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center flex-shrink-0 gap-2">
              <FeedSelector
                feeds={feeds}
                selectedFeedId={selectedFeedId}
                onFeedSelect={onFeedSelect}
              />
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap sm:flex-nowrap">
              <div className="flex items-center mr-1">
                <RefreshButton
                  onRefresh={onRefresh}
                  lastRefreshTime={lastRefreshTime}
                  isSyncing={isSyncing}
                />
              </div>

              <Separator
                orientation="vertical"
                className="hidden sm:block h-8 mx-1"
              />

              <ViewToggle
                viewMode={viewMode}
                onViewModeChange={onViewModeChange}
              />

              <FilterButton onOpenFilters={onOpenFilters} />
              <KeyboardButton
                onShowKeyboardShortcuts={onShowKeyboardShortcuts}
              />

              <Separator
                orientation="vertical"
                className="hidden sm:block h-8 mx-1"
              />

              <AddFeedButton onAddFeed={onAddFeed} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
