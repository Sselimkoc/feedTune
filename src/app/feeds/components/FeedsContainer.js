"use client";

import { useState } from "react";
import { FeedLayout } from "./FeedLayout";
import { FeedHeader } from "./FeedHeader";
import { FeedGrid } from "./FeedGrid";
import { FilterDialog } from "@/components/features/feeds/dialogs/FilterDialog";
import { KeyboardShortcutsDialog } from "@/components/features/feeds/dialogs/KeyboardShortcutsDialog";
import { AddFeedDialog } from "@/components/features/feeds/dialogs/AddFeedDialog";
import { EmptyState } from "@/components/ui-states/EmptyState";
import { LoadingState } from "@/components/ui-states/LoadingState";
import { ErrorState } from "@/components/ui-states/ErrorState";
import { useFeedScreen } from "@/hooks/features/useFeedScreen";

export function FeedsContainer() {
  // UI durumu
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const [addFeedDialogOpen, setAddFeedDialogOpen] = useState(false);

  // Hook'lar
  const {
    feeds,
    items,
    selectedFeed,
    selectedFeedId,
    viewMode,
    filters,
    isLoading,
    isError,
    error,
    handleFeedSelect,
    applyFilters,
    changeViewMode,
    refresh,
    toggleRead,
    toggleFavorite,
    toggleReadLater,
  } = useFeedScreen();

  // İçerik görüntüleme
  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState onRetry={refresh} error={error} />;
  }

  if (!feeds || feeds.length === 0) {
    return (
      <>
        <EmptyState onAddFeed={() => setAddFeedDialogOpen(true)} />
        <AddFeedDialog
          isOpen={addFeedDialogOpen}
          onOpenChange={setAddFeedDialogOpen}
          onFeedAdded={refresh}
        />
      </>
    );
  }

  return (
    <FeedLayout>
      {/* Header */}
      <FeedHeader
        feeds={feeds}
        selectedFeedId={selectedFeedId}
        onFeedSelect={handleFeedSelect}
        onOpenFilters={() => setFilterDialogOpen(true)}
        onShowKeyboardShortcuts={() => setShortcutsDialogOpen(true)}
        onRefresh={refresh}
        viewMode={viewMode}
        onViewModeChange={changeViewMode}
        onAddFeed={() => setAddFeedDialogOpen(true)}
      />

      {/* İçerik */}
      <FeedGrid
        items={items}
        feeds={feeds}
        viewMode={viewMode}
        onToggleRead={toggleRead}
        onToggleFavorite={toggleFavorite}
        onToggleReadLater={toggleReadLater}
      />

      {/* Diyaloglar */}
      <FilterDialog
        isOpen={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        filters={filters}
        onApplyFilters={applyFilters}
      />

      <KeyboardShortcutsDialog
        isOpen={shortcutsDialogOpen}
        onOpenChange={setShortcutsDialogOpen}
      />

      <AddFeedDialog
        isOpen={addFeedDialogOpen}
        onOpenChange={setAddFeedDialogOpen}
        onFeedAdded={refresh}
      />
    </FeedLayout>
  );
}
