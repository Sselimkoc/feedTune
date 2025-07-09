"use client";

import { useState, useEffect } from "react";
import { FeedItem } from "@/components/features/feed/layout/FeedItem";
import { LoadingState } from "@/components/core/states/LoadingState";
import { ErrorState } from "@/components/core/states/ErrorState";
import { EmptyState } from "@/components/core/states/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";
import { useInView } from "react-intersection-observer";
import { toast } from "@/components/core/ui/use-toast";

export function ContentContainer({
  headerTitle,
  headerDescription,
  headerIcon,
  viewMode,
  onViewModeChange,
  onRefresh,
  contentType,
  items = [],
  isLoading,
  isTransitioning,
  isRefreshing,
  isError,
  error,
  isEmpty,
  emptyTitle,
  emptyDescription,
  emptyActionText,
  onEmptyAction,
  onToggleFavorite,
  onToggleReadLater,
  onItemClick,
  sidebar,
  toolbar,
  hasMore = false,
  loadMoreItems,
  isLoadingMore,
}) {
  const { t } = useLanguage();
  const [animateItems, setAnimateItems] = useState(false);
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // Handle infinite scroll
  useEffect(() => {
    if (inView && hasMore && !isLoadingMore && !isLoading) {
      loadMoreItems?.();
    }
  }, [inView, hasMore, isLoadingMore, isLoading, loadMoreItems]);

  // Animate items after initial load
  useEffect(() => {
    if (!isLoading && items.length > 0) {
      const timer = setTimeout(() => {
        setAnimateItems(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, items]);

  // Handle item click
  const handleItemClick = (url, item) => {
    if (onItemClick) {
      onItemClick(item);
    } else if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Handle favorite toggle
  const handleToggleFavorite = (itemId, isFavorite) => {
    const item = items.find((i) => i.id === itemId);
    if (item && onToggleFavorite) {
      onToggleFavorite(item);
    }
  };

  // Handle read later toggle
  const handleToggleReadLater = (itemId, isReadLater) => {
    const item = items.find((i) => i.id === itemId);
    if (item && onToggleReadLater) {
      onToggleReadLater(item);
    }
  };

  // Handle share
  const handleShare = (item) => {
    if (navigator.share && item.url) {
      navigator
        .share({
          title: item.title,
          text: item.description,
          url: item.url,
        })
        .catch((error) => console.error("Error sharing:", error));
    } else if (item.url) {
      navigator.clipboard
        .writeText(item.url)
        .then(() =>
          toast({
            title: t("common.copied"),
            description: t("common.urlCopied"),
          })
        )
        .catch((error) => console.error("Error copying:", error));
    }
  };

  // Render content based on state
  const renderContent = () => {
    if (isLoading) {
      return <LoadingState message={t("common.loading")} />;
    }

    if (isError) {
      return (
        <ErrorState
          title={t("common.error")}
          description={error?.message || t("errors.generic")}
          actionText={t("common.retry")}
          onAction={onRefresh}
        />
      );
    }

    if (isEmpty || items.length === 0) {
      return (
        <EmptyState
          title={emptyTitle || t("common.noItems")}
          description={emptyDescription || t("common.noItemsDescription")}
          actionText={emptyActionText || t("common.refresh")}
          onAction={onEmptyAction || onRefresh}
        />
      );
    }

    return (
      <div
        className={`grid gap-6 ${
          viewMode === "grid"
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid-cols-1"
        }`}
      >
        {items.map((item) => (
          <FeedItem
            key={item.id}
            item={item}
            viewMode={viewMode}
            onClick={(url) => handleItemClick(url, item)}
            onFavorite={handleToggleFavorite}
            onReadLater={handleToggleReadLater}
            onShare={() => handleShare(item)}
          />
        ))}
        {hasMore && (
          <div ref={loadMoreRef} className="w-full py-8 flex justify-center">
            {isLoadingMore && (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                <span>{t("common.loadingMore")}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      {sidebar && (
        <aside className="hidden md:block w-64 lg:w-72 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
          {sidebar}
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <header className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {headerIcon && <div className="text-primary">{headerIcon}</div>}
              <div>
                <h1 className="text-2xl font-bold">{headerTitle}</h1>
                {headerDescription && (
                  <p className="text-muted-foreground">{headerDescription}</p>
                )}
              </div>
            </div>
            {toolbar && (
              <div className="flex items-center gap-2">{toolbar}</div>
            )}
          </header>

          {/* Content */}
          <div
            className={`transition-opacity duration-300 ${
              isTransitioning ? "opacity-50" : "opacity-100"
            }`}
          >
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
