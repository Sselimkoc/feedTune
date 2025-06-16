"use client";

import { memo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { ContentList } from "@/components/shared/ContentList";
import { EmptyState } from "@/components/ui-states/EmptyState";
import { LoadingState } from "@/components/ui-states/LoadingState";
import { ErrorState } from "@/components/ui-states/ErrorState";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useLanguage } from "@/hooks/useLanguage";
import { useSettingsStore } from "@/store/useSettingsStore";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";

/**
 * Tüm içerik sayfaları (feeds, favorites, read-later) için standart içerik kapsayıcısı
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
  contentType, // "youtube", "rss" vb.
  items = [],
  isLoading = false,
  isTransitioning = false,
  isRefreshing = false,
  isError = false,
  error = null,
  isEmpty = false,

  cardType,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyActionText,
  onEmptyAction,

  // Callbacks
  onToggleFavorite,
  onToggleReadLater,
  onItemClick,

  // Dialog
  onOpenShortcutsDialog = () => {},

  // Pagination
  hasMore = false,
  loadMoreItems = () => {},
  isLoadingMore = false,

  // Diğer bileşenler
  sidebar = null,
  toolbar = null,

  // Direkt içerik geçişi
  children,
  className = "",
}) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { isCompactMode } = useSettingsStore();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Tema renklerini belirle
  const getContainerBackground = () => {
    if (theme === "dark") {
      return contentType === "youtube"
        ? "bg-gradient-to-b from-red-950/5 to-zinc-900/30"
        : contentType === "rss"
        ? "bg-gradient-to-b from-blue-950/5 to-zinc-900/30"
        : "bg-gradient-to-b from-zinc-900/5 to-zinc-900/10";
    } else {
      return contentType === "youtube"
        ? "bg-gradient-to-b from-red-50/80 to-zinc-100/30"
        : contentType === "rss"
        ? "bg-gradient-to-b from-blue-50/80 to-zinc-100/30"
        : "bg-gradient-to-b from-zinc-50/80 to-zinc-100/30";
    }
  };

  // Boş durumda eylem fonksiyonu
  const handleEmptyAction = useCallback(() => {
    if (onEmptyAction) {
      onEmptyAction();
    } else if (onRefresh) {
      onRefresh();
    }
  }, [onEmptyAction, onRefresh]);

  // Yeniden deneme fonksiyonu
  const handleRetry = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  // Animasyon için varyantlar
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
        when: "beforeChildren",
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <Card
      className={`flex h-full w-full flex-grow flex-col overflow-hidden ${className}`}
    >
      <motion.div
        className={`flex h-full w-full flex-col overflow-hidden ${getContainerBackground()}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Header kısmı */}
        <div className="flex flex-col space-y-1 p-4 pb-0 sm:p-6 sm:pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {headerIcon && (
                <div className="h-5 w-5 text-foreground/70">{headerIcon}</div>
              )}
              <h1 className="text-xl font-semibold">{headerTitle}</h1>
            </div>

            {toolbar && (
              <div className="flex items-center gap-2">{toolbar}</div>
            )}
          </div>

          {headerDescription && (
            <p className="text-sm text-muted-foreground">{headerDescription}</p>
          )}
        </div>

        {/* Ana içerik alanı */}
        <div className="flex flex-1 overflow-hidden pt-4">
          {/* Sidebar */}
          {sidebar && (
            <aside className="hidden w-56 shrink-0 border-r px-4 md:block">
              {sidebar}
            </aside>
          )}

          {/* İçerik */}
          <div className="flex-1 overflow-hidden px-3 pb-4 sm:px-6">
            <AnimatePresence mode="wait">
              {items && items.length > 0 ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full overflow-auto"
                >
                  {/* Yükleme devam ediyorsa bilgi ver */}
                  {(isLoading || isTransitioning) && !isRefreshing && (
                    <div className="mb-2 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        {t("feeds.loadingButShowingContent")}
                      </span>
                    </div>
                  )}

                  {children || (
                    <ContentList
                      items={items}
                      viewMode={viewMode}
                      cardType={cardType}
                      isCompactMode={isCompactMode}
                      onToggleFavorite={onToggleFavorite}
                      onToggleReadLater={onToggleReadLater}
                      onItemClick={onItemClick}
                      isMobile={isMobile}
                      hasMore={hasMore}
                      loadMoreItems={loadMoreItems}
                      isLoadingMore={isLoadingMore}
                    />
                  )}
                </motion.div>
              ) : isLoading || isTransitioning ? (
                <LoadingState
                  key="loading"
                  viewMode={viewMode}
                  title={
                    isRefreshing ? t("feeds.refreshing") : t("feeds.loading")
                  }
                  description={
                    isRefreshing
                      ? t("feeds.refreshingDescription")
                      : t("feeds.loadingDescription")
                  }
                  contentType={contentType}
                  minimal={isRefreshing}
                  showSpinner={!isRefreshing}
                />
              ) : isError ? (
                <ErrorState
                  key="error"
                  contentType={contentType}
                  errorType={
                    error?.name === "NetworkError"
                      ? "network"
                      : error?.status >= 500
                      ? "server"
                      : "default"
                  }
                  title={t("errors.loadingFailed")}
                  description={error?.message || t("errors.somethingWentWrong")}
                  actionText={t("errors.tryAgain")}
                  onAction={handleRetry}
                  error={error}
                  showDetails={process.env.NODE_ENV === "development"}
                />
              ) : isEmpty && (
                <EmptyState
                  key="empty"
                  type={contentType || "default"}
                  icon={emptyIcon}
                  title={emptyTitle || t("common.noContent")}
                  description={
                    emptyDescription || t("common.noContentDescription")
                  }
                  actionText={emptyActionText}
                  onAction={handleEmptyAction}
                  isRefreshable={!!onRefresh}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </Card>
  );
});

ContentContainer.displayName = "ContentContainer";

export { ContentContainer };
