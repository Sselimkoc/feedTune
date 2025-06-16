"use client";

import { memo, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ContentCard } from "@/components/shared/ContentCard";
import { Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";

/**
 * İçerik öğelerinin listesini görüntüler
 */
const ContentList = memo(function ContentList({
  items = [],
  cardType = "feed",
  viewMode = "grid",
  isCompactMode = false,
  onToggleFavorite,
  onToggleReadLater,
  onItemClick,
  isMobile = false,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  onMarkAsRead,
  onMarkAsUnread,
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const loaderRef = useRef(null);
  const listRef = useRef(null);
  const loadingRef = useRef(false);

  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  const handleIntersection = useCallback(async () => {
    if (inView && !loadingRef.current) {
      loadingRef.current = true;
      try {
        await onLoadMore();
      } finally {
        loadingRef.current = false;
      }
    }
  }, [inView, onLoadMore]);

  useEffect(() => {
    handleIntersection();
  }, [handleIntersection]);

  // Kart üzerine tıklama işleyicisi
  const handleCardClick = useCallback(
    (item) => {
      if (onItemClick) {
        onItemClick(item);
      }
    },
    [onItemClick]
  );

  // Favori durumu değiştirme işleyicisi
  const handleToggleFavorite = useCallback(
    (item) => {
      if (onToggleFavorite) {
        onToggleFavorite(item);
      }
    },
    [onToggleFavorite]
  );

  // Daha sonra oku durumu değiştirme işleyicisi
  const handleToggleReadLater = useCallback(
    (item) => {
      if (onToggleReadLater) {
        onToggleReadLater(item);
      }
    },
    [onToggleReadLater]
  );

  // Animasyon varyantları
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        when: "beforeChildren",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  // Liste boşsa erken döndür
  if (items.length === 0) {
    return null;
  }

  return (
    <motion.div
      ref={listRef}
      className="flex flex-col space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* İçerik öğeleri gridi/listesi */}
      <div
        className={`grid gap-4 ${
          viewMode === "grid"
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1"
        }`}
      >
        {items.map((item) => (
          <motion.div key={item.id} variants={itemVariants} layout>
            <ContentCard
              item={item}
              cardType={cardType}
              viewMode={viewMode}
              isCompactMode={isCompactMode}
              onClick={() => handleCardClick(item)}
              onToggleFavorite={() => handleToggleFavorite(item)}
              onToggleReadLater={() => handleToggleReadLater(item)}
              onMarkAsRead={onMarkAsRead}
              onMarkAsUnread={onMarkAsUnread}
              isMobile={isMobile}
            />
          </motion.div>
        ))}
      </div>

      {/* Daha fazla yükleme göstergesi */}
      {hasMore && (
        <div ref={ref} className="flex justify-center py-4">
          <div ref={loaderRef} className="flex flex-col items-center">
            <Loader2
              className={`h-8 w-8 animate-spin ${
                theme === "dark" ? "text-zinc-400" : "text-zinc-500"
              }`}
            />
            <p
              className={`mt-2 text-sm ${
                theme === "dark" ? "text-zinc-400" : "text-zinc-500"
              }`}
            >
              {isLoadingMore
                ? t("feeds.loadingMoreItems")
                : t("feeds.scrollToLoadMore")}
            </p>
          </div>
        </div>
      )}

      {/* Sonuna geldiniz mesajı */}
      {!hasMore && items.length > 0 && (
        <div className="flex justify-center py-4">
          <p
            className={`text-sm ${
              theme === "dark" ? "text-zinc-400" : "text-zinc-500"
            }`}
          >
            {t("feeds.endOfList")}
          </p>
        </div>
      )}
    </motion.div>
  );
});

ContentList.displayName = "ContentList";

export { ContentList };
