"use client";

import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFeedScreen } from "@/hooks/features/useFeedScreen";
import { FeedHeader } from "@/components/features/feeds/layout/FeedHeader";
import { FeedSidebar } from "@/components/features/feeds/layout/FeedSidebar";
import { FeedList } from "@/components/features/feeds/layout/FeedList";
import { EmptyState } from "../common/EmptyState";
import { LoadingState } from "@/components/ui-states/LoadingState";
import { ErrorState } from "@/components/ui-states/ErrorState";
import { KeyboardShortcutsDialog } from "@/components/features/feeds/dialogs/KeyboardShortcutsDialog";
import { FilterDialog } from "@/components/features/feeds/dialogs/FilterDialog";
import { AddFeedDialog } from "@/components/features/feeds/dialogs/AddFeedDialog";

export const FeedContainer = memo(function FeedContainer() {
  const {
    feeds,
    items,
    selectedFeed,
    viewMode,
    filters,
    stats,
    isLoading,
    isInitialLoading,
    isTransitioning,
    isError,
    error,
    setActiveFilter,
    setViewMode,
    applyFilters,
    resetFilters,
    toggleRead,
    toggleFavorite,
    toggleReadLater,
    shareItem,
    refreshAll,
  } = useFeedScreen();

  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showAddFeedDialog, setShowAddFeedDialog] = useState(false);

  // Ana yükleme durumu
  if (isLoading) {
    return <LoadingState viewMode={viewMode} />;
  }

  // Hata durumu
  if (isError) {
    return <ErrorState error={error} onRetry={refreshAll} />;
  }

  // Feed'ler boş durumu
  if (!feeds || feeds.length === 0) {
    return (
      <EmptyState type="feed" onAddFeed={() => setShowAddFeedDialog(true)} />
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <FeedHeader
        selectedFeed={selectedFeed}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenFilters={() => setShowFilterDialog(true)}
        onShowKeyboardShortcuts={() => setShowKeyboardShortcuts(true)}
        onAddFeed={() => setShowAddFeedDialog(true)}
        filters={filters}
        stats={stats}
      />

      <div className="flex flex-col lg:flex-row flex-1 gap-6 p-6">
        <aside className="w-full lg:w-72 lg:order-2">
          <div className="sticky top-6">
            <FeedSidebar
              feeds={feeds}
              selectedFeed={selectedFeed}
              onFeedSelect={setActiveFilter}
              stats={stats}
            />
          </div>
        </aside>

        <main className="flex-1 min-w-0 lg:order-1">
          <AnimatePresence mode="wait" initial={false}>
            {isInitialLoading || isTransitioning ? (
              <motion.div
                key={`loading-${selectedFeed?.id || "all"}-${Date.now()}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <LoadingState viewMode={viewMode} />
              </motion.div>
            ) : !items || items.length === 0 ? (
              <motion.div
                key={`empty-${selectedFeed?.id || "all"}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <EmptyState
                  type="filter"
                  onResetFilters={resetFilters}
                  onRefresh={refreshAll}
                />
              </motion.div>
            ) : (
              <motion.div
                key={`content-${selectedFeed?.id || "all"}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <FeedList
                  items={items}
                  viewMode={viewMode}
                  onItemClick={toggleRead}
                  onToggleFavorite={toggleFavorite}
                  onToggleReadLater={toggleReadLater}
                  onShare={shareItem}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <FilterDialog
        open={showFilterDialog}
        onOpenChange={setShowFilterDialog}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
        activeFilter={selectedFeed?.id}
        filters={filters}
      />

      <KeyboardShortcutsDialog
        isOpen={showKeyboardShortcuts}
        onOpenChange={setShowKeyboardShortcuts}
      />

      <AddFeedDialog
        isOpen={showAddFeedDialog}
        onOpenChange={setShowAddFeedDialog}
      />
    </div>
  );
});
