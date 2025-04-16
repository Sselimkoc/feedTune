"use client";

import { useState, memo, useCallback } from "react";
import { useFeedScreen } from "@/hooks/features/useFeedScreen";
import { ContentContainer } from "@/components/shared/ContentContainer";
import { FeedSidebar } from "@/components/features/feeds/layout/FeedSidebar";
import { KeyboardShortcutsDialog } from "@/components/features/feeds/dialogs/KeyboardShortcutsDialog";
import { FilterDialog } from "@/components/features/feeds/dialogs/FilterDialog";
import { AddFeedDialog } from "@/components/features/feeds/dialogs/AddFeedDialog";
import { useLanguage } from "@/hooks/useLanguage";
import { FilterButton } from "@/components/features/feeds/buttons/FilterButton";
import { AddFeedButton } from "@/components/features/feeds/buttons/AddFeedButton";
import { Rss, Youtube } from "lucide-react";

export const FeedContainer = memo(function FeedContainer() {
  const { t } = useLanguage();
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

  // State
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showAddFeedDialog, setShowAddFeedDialog] = useState(false);

  // Event handlers
  const handleShowKeyboardShortcuts = useCallback(() => {
    setShowKeyboardShortcuts(true);
  }, []);

  const handleKeyboardShortcutsChange = useCallback((isOpen) => {
    setShowKeyboardShortcuts(isOpen);
  }, []);

  const handleViewModeChange = useCallback(
    (mode) => {
      setViewMode(mode);
    },
    [setViewMode]
  );

  const handleOpenFilters = useCallback(() => {
    setShowFilterDialog(true);
  }, []);

  const handleAddFeed = useCallback(() => {
    setShowAddFeedDialog(true);
  }, []);

  // Ekstra header butonları
  const extraButtons = (
    <>
      <AddFeedButton onAddFeed={handleAddFeed} />
      <FilterButton onOpenFilters={handleOpenFilters} />
    </>
  );

  // Feed başlık ve icon bilgisini hazırla
  const feedHeaderIcon = selectedFeed ? (
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
  ) : (
    <Rss className="h-6 w-6 text-primary" />
  );

  const feedTitle = selectedFeed ? selectedFeed.title : t("feeds.allFeeds");
  const feedDescription = selectedFeed
    ? selectedFeed.description || t("feeds.noDescription")
    : t("feeds.allFeedsDescription");

  // Boş durum kontrolü
  if (!feeds || feeds.length === 0) {
    return (
      <ContentContainer
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onRefresh={refreshAll}
        headerIcon={<Rss className="h-6 w-6 text-primary" />}
        headerTitle={t("feeds.title")}
        headerDescription={t("feeds.description")}
        items={[]}
        isLoading={isLoading}
        isError={isError}
        error={error}
        cardType="feed"
        emptyIcon={<Rss className="h-10 w-10 opacity-20" />}
        emptyTitle={t("feeds.emptyTitle")}
        emptyDescription={t("feeds.emptyDescription")}
        onToggleFavorite={toggleFavorite}
        onToggleReadLater={toggleReadLater}
        extraHeaderButtons={extraButtons}
        extraDialogs={
          <AddFeedDialog
            isOpen={showAddFeedDialog}
            onOpenChange={setShowAddFeedDialog}
            onFeedAdded={refreshAll}
          />
        }
      />
    );
  }

  return (
    <ContentContainer
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
      onRefresh={refreshAll}
      headerIcon={feedHeaderIcon}
      headerTitle={feedTitle}
      headerDescription={feedDescription}
      items={items}
      isLoading={isLoading || isInitialLoading || isTransitioning}
      isError={isError}
      error={error}
      cardType="feed"
      emptyIcon={<Rss className="h-10 w-10 opacity-20" />}
      emptyTitle={t("feeds.noItems")}
      emptyDescription={t("feeds.noItemsDescription")}
      onToggleFavorite={toggleFavorite}
      onToggleReadLater={toggleReadLater}
      onItemClick={async (url, item) => {
        if (url) {
          window.open(url, "_blank");
          if (item && !item.is_read) {
            try {
              await toggleRead(item.id, true);
            } catch (error) {
              console.error("İçerik okundu işaretlenemedi:", error);
            }
          }
        }
      }}
      showKeyboardShortcuts={showKeyboardShortcuts}
      onShowKeyboardShortcuts={handleShowKeyboardShortcuts}
      onKeyboardShortcutsChange={handleKeyboardShortcutsChange}
      extraHeaderButtons={extraButtons}
      sidebarContent={
        <FeedSidebar
          feeds={feeds}
          selectedFeed={selectedFeed}
          onFeedSelect={setActiveFilter}
          stats={stats}
        />
      }
      extraDialogs={
        <>
          <FilterDialog
            open={showFilterDialog}
            onOpenChange={setShowFilterDialog}
            onApplyFilters={applyFilters}
            onResetFilters={resetFilters}
            activeFilter={selectedFeed?.id}
            filters={filters}
          />
          <AddFeedDialog
            isOpen={showAddFeedDialog}
            onOpenChange={setShowAddFeedDialog}
            onFeedAdded={refreshAll}
          />
        </>
      }
    />
  );
});
