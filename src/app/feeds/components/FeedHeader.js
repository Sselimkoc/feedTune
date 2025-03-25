"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AddFeedButton } from "./buttons/AddFeedButton";
import { FeedNavigation } from "./navigation/FeedNavigation";
import { ViewToggle } from "./buttons/ViewToggle";
import { FilterButton } from "./buttons/FilterButton";
import { KeyboardButton } from "./buttons/KeyboardButton";
import { RefreshButton } from "./buttons/RefreshButton";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

export function FeedHeader({
  feeds,
  selectedFeedId,
  onFeedSelect,
  onOpenFilters,
  onShowKeyboardShortcuts,
  onRefresh,
  viewMode,
  onViewModeChange,
}) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full sticky top-0 z-10"
    >
      <Card className="border-b shadow-sm rounded-none">
        <CardContent className="p-2 sm:p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <FeedNavigation
                feeds={feeds}
                selectedFeedId={selectedFeedId}
                onFeedSelect={onFeedSelect}
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <RefreshButton onRefresh={onRefresh} />
              <ViewToggle
                viewMode={viewMode}
                onViewModeChange={onViewModeChange}
              />
              <FilterButton onOpenFilters={onOpenFilters} />
              <KeyboardButton
                onShowKeyboardShortcuts={onShowKeyboardShortcuts}
              />
              <AddFeedButton />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
