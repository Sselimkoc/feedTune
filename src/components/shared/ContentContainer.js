"use client";

import { memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ContentHeader } from "@/components/shared/ContentHeader";
import { ContentList } from "@/components/shared/ContentList";
import { KeyboardShortcutsDialog } from "@/components/features/feeds/dialogs/KeyboardShortcutsDialog";

/**
 * İçerik konteyneri bileşeni - Tüm içerik sayfaları için standart düzen sağlar
 * Favoriler, Daha Sonra Oku ve Beslemeler sayfaları için kullanılabilir
 */
const ContentContainer = memo(function ContentContainer({
  // Header props
  viewMode,
  onViewModeChange,
  onRefresh,
  headerIcon,
  headerTitle,
  headerDescription,

  // Content props
  items,
  isLoading,
  isError,
  error,
  cardType,
  emptyIcon,
  emptyTitle,
  emptyDescription,

  // Callbacks
  onToggleFavorite,
  onToggleReadLater,
  onItemClick,

  // Dialog control
  showKeyboardShortcuts,
  onShowKeyboardShortcuts,
  onKeyboardShortcutsChange,

  // Additional components
  extraHeaderButtons,
  sidebarContent,
  extraDialogs,
  children,
}) {
  // Memoize HeaderClickHandler
  const handleHeaderRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  // Memoize Dialog control handlers
  const handleKeyboardShortcutsChange = useCallback(
    (isOpen) => {
      if (onKeyboardShortcutsChange) {
        onKeyboardShortcutsChange(isOpen);
      }
    },
    [onKeyboardShortcutsChange]
  );

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Gradient background */}
      <div className="fixed inset-0 bg-gradient-to-b from-background via-background to-muted/20 pointer-events-none -z-10" />

      {/* Header */}
      <ContentHeader
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        onRefresh={handleHeaderRefresh}
        onShowKeyboardShortcuts={onShowKeyboardShortcuts}
        icon={headerIcon}
        title={headerTitle}
        description={headerDescription}
        extraButtons={extraHeaderButtons}
      />

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col lg:flex-row flex-1 gap-4 md:gap-6 p-3 md:p-6"
        >
          {/* Sidebar - For pages that need a sidebar like feeds page */}
          {sidebarContent && (
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="w-full lg:w-80 xl:w-96 lg:order-2"
            >
              <div className="sticky top-6">{sidebarContent}</div>
            </motion.aside>
          )}

          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`flex-1 min-w-0 ${
              sidebarContent ? "lg:order-1" : ""
            } relative`}
          >
            {/* Glass effect background */}
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] rounded-xl -z-10 shadow-sm border border-border/40" />

            <div className="p-4 md:p-6">
              {children || (
                <ContentList
                  items={items}
                  viewMode={viewMode}
                  cardType={cardType}
                  isLoading={isLoading}
                  isError={isError}
                  error={error}
                  emptyIcon={emptyIcon}
                  emptyTitle={emptyTitle}
                  emptyDescription={emptyDescription}
                  onRetry={handleHeaderRefresh}
                  onToggleFavorite={onToggleFavorite}
                  onToggleReadLater={onToggleReadLater}
                  onItemClick={onItemClick}
                />
              )}
            </div>
          </motion.main>
        </motion.div>
      </AnimatePresence>

      {/* Dialogs */}
      {showKeyboardShortcuts !== undefined && (
        <KeyboardShortcutsDialog
          isOpen={showKeyboardShortcuts}
          onOpenChange={handleKeyboardShortcutsChange}
        />
      )}

      {/* Additional dialogs - For pages that need specific dialogs like the feeds page */}
      {extraDialogs}
    </div>
  );
});

export { ContentContainer };
