"use client";

import { RefreshButton } from "@/components/features/feeds/buttons/RefreshButton";
import { SyncButton } from "@/components/features/feeds/buttons/SyncButton";
import { ViewToggle } from "@/components/features/feeds/buttons/ViewToggle";
import { FilterButton } from "@/components/features/feeds/buttons/FilterButton";
import { KeyboardButton } from "@/components/features/feeds/buttons/KeyboardButton";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export function ReadLaterHeader({
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
      className="w-full sticky top-0 z-10"
    >
      <Card className="border-b shadow-sm rounded-none">
        <CardContent className="p-2 sm:p-4">
          <div className="flex items-center justify-end gap-2">
            <RefreshButton onRefresh={onRefresh} />
            <SyncButton />
            <ViewToggle
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
            />
            <FilterButton onOpenFilters={onOpenFilters} />
            <KeyboardButton onShowKeyboardShortcuts={onShowKeyboardShortcuts} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
