"use client";

import { memo } from "react";
import { Card } from "@/components/ui/card";
import { ViewToggle } from "@/components/features/feeds/buttons/ViewToggle";
import { SyncButton } from "@/components/features/feeds/buttons/SyncButton";
import { FilterButton } from "@/components/features/feeds/buttons/FilterButton";
import { KeyboardButton } from "@/components/features/feeds/buttons/KeyboardButton";
import { motion } from "framer-motion";

export const FavoritesHeader = memo(function FavoritesHeader({
  pageTitle,
  pageDescription,
  onRefresh,
  viewMode,
  onViewModeChange,
  onOpenFilters,
  onShowKeyboardShortcuts,
}) {
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
            <h1 className="text-2xl font-semibold">{pageTitle}</h1>
            <p className="text-sm text-muted-foreground">{pageDescription}</p>
          </div>
          <div className="flex items-center gap-2">
            <SyncButton onRefresh={onRefresh} />
            <ViewToggle value={viewMode} onValueChange={onViewModeChange} />
            <FilterButton onClick={onOpenFilters} />
            <KeyboardButton onClick={onShowKeyboardShortcuts} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
});
