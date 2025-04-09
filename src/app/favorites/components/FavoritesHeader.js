"use client";

import { SyncButton } from "@/components/features/feeds/buttons/SyncButton";
import { ViewToggle } from "@/components/features/feeds/buttons/ViewToggle";
import { FilterButton } from "@/components/features/feeds/buttons/FilterButton";
import { KeyboardButton } from "@/components/features/feeds/buttons/KeyboardButton";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export function FavoritesHeader({
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
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full sticky top-0 z-50"
    >
      <Card className="border-b shadow-sm rounded-none">
        <CardContent className="p-2 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold">{pageTitle}</h1>
              <p className="text-sm text-muted-foreground">{pageDescription}</p>
            </div>

            <div className="flex items-center gap-2">
              <SyncButton onSync={onRefresh} />
              <ViewToggle
                viewMode={viewMode}
                onViewModeChange={onViewModeChange}
              />
              <FilterButton onOpenFilters={onOpenFilters} />
              <KeyboardButton
                onShowKeyboardShortcuts={onShowKeyboardShortcuts}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
