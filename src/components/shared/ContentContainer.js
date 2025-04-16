"use client";

import { memo, useCallback } from "react";
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
  const handleKeyboardShortcutsChange = useCallback((isOpen) => {
    if (onKeyboardShortcutsChange) {
      onKeyboardShortcutsChange(isOpen);
    }
  }, [onKeyboardShortcutsChange]);

  return (
    <div className="flex flex-col min-h-screen">
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

      {/* Ana İçerik */}
      <div className="flex flex-col lg:flex-row flex-1 gap-6 p-4 md:p-6">
        {/* Yan Panel - Beslemeler sayfası gibi yan panel isteyen sayfalar için */}
        {sidebarContent && (
          <aside className="w-full lg:w-72 lg:order-2">
            <div className="sticky top-6">{sidebarContent}</div>
          </aside>
        )}

        {/* Ana İçerik */}
        <main
          className={`flex-1 min-w-0 ${sidebarContent ? "lg:order-1" : ""}`}
        >
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
        </main>
      </div>

      {/* Diyaloglar */}
      {showKeyboardShortcuts !== undefined && (
        <KeyboardShortcutsDialog
          isOpen={showKeyboardShortcuts}
          onOpenChange={handleKeyboardShortcutsChange}
        />
      )}

      {/* Ek diyaloglar - beslemeler sayfası gibi özel diyalog isteyen sayfalar için */}
      {extraDialogs}
    </div>
  );
});

export { ContentContainer };
