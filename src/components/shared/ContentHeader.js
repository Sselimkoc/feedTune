"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { ViewToggle } from "@/components/features/feeds/buttons/ViewToggle";
import { SyncButton } from "@/components/features/feeds/buttons/SyncButton";
import { KeyboardButton } from "@/components/features/feeds/buttons/KeyboardButton";

/**
 * Ortak içerik başlığı bileşeni - Tüm içerik sayfaları için kullanılır
 */
const ContentHeader = memo(function ContentHeader({
  viewMode,
  onViewModeChange,
  onRefresh,
  onShowKeyboardShortcuts,
  icon,
  title,
  description,
  extraButtons,
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
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              {icon}
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            {extraButtons}

            {onRefresh && <SyncButton onSync={onRefresh} />}
            {viewMode && onViewModeChange && (
              <ViewToggle
                viewMode={viewMode}
                onViewModeChange={onViewModeChange}
              />
            )}
            {onShowKeyboardShortcuts && (
              <KeyboardButton
                onShowKeyboardShortcuts={onShowKeyboardShortcuts}
              />
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

export { ContentHeader };
