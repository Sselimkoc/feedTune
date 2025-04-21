"use client";

import { memo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ContentCard } from "@/components/shared/ContentCard";
import { toast } from "sonner";
import { stripHtml } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { EmptyState } from "@/components/ui-states/EmptyState";
import { LoadingState } from "@/components/ui-states/LoadingState";
import { ErrorState } from "@/components/ui-states/ErrorState";

/**
 * İçerik listesi bileşeni - Favoriler ve Daha Sonra Oku sayfaları için genel liste görünümü
 */
const ContentList = memo(function ContentList({
  items,
  viewMode,
  cardType,
  isLoading,
  isError,
  error,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  loadingTitle,
  onRetry,
  onToggleFavorite,
  onToggleReadLater,
  onItemClick,
}) {
  const { t } = useLanguage();

  // Optimistik UI için geçici durumları tutacak state
  const [optimisticStates, setOptimisticStates] = useState({});

  // Paylaşım işlemi
  const handleShareItem = useCallback(
    (item) => {
      const shareUrl = item.url;
      if (navigator.share && shareUrl) {
        navigator.share({
          title: item.title,
          text: stripHtml(item.description).slice(0, 100),
          url: shareUrl,
        });
      } else if (shareUrl) {
        navigator.clipboard.writeText(shareUrl);
        toast.success(t("common.success"), {
          description: t("feeds.urlCopied"),
        });
      }
    },
    [t]
  );

  // İçerik tıklama
  const handleItemClick = useCallback(
    (url, item) => {
      if (onItemClick) {
        onItemClick(url, item);
      } else if (url) {
        window.open(url, "_blank");
      }
    },
    [onItemClick]
  );

  // Favori değiştirme - optimistik UI güncellemesi ile
  const handleToggleFavorite = useCallback(
    async (itemId, isFavorite) => {
      // Optimistik UI güncelleme
      setOptimisticStates((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          isFavorite,
        },
      }));

      if (onToggleFavorite) {
        try {
          await onToggleFavorite(itemId, isFavorite);

          // Başarılı durumda bildirim göster
          toast.success(
            isFavorite
              ? t("notifications.addedToFavorites")
              : t("notifications.removedFromFavorites"),
            {
              position: "bottom-right",
              duration: 2000,
            }
          );
        } catch (error) {
          // Hata durumunda optimistik güncellemeyi geri al
          setOptimisticStates((prev) => ({
            ...prev,
            [itemId]: {
              ...prev[itemId],
              isFavorite: !isFavorite,
            },
          }));
          toast.error(t("errors.actionFailed"), {
            description: t("errors.tryAgain"),
            position: "bottom-right",
          });
          console.error("Favori değiştirme başarısız:", error);
        }
      }
    },
    [onToggleFavorite, t]
  );

  // Daha sonra oku değiştirme - optimistik UI güncellemesi ile
  const handleToggleReadLater = useCallback(
    async (itemId, isReadLater) => {
      // Optimistik UI güncelleme
      setOptimisticStates((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          isReadLater,
        },
      }));

      if (onToggleReadLater) {
        try {
          await onToggleReadLater(itemId, isReadLater);

          // Başarılı durumda bildirim göster
          toast.success(
            isReadLater
              ? t("notifications.addedToReadLater")
              : t("notifications.removedFromReadLater"),
            {
              position: "bottom-right",
              duration: 2000,
            }
          );
        } catch (error) {
          // Hata durumunda optimistik güncellemeyi geri al
          setOptimisticStates((prev) => ({
            ...prev,
            [itemId]: {
              ...prev[itemId],
              isReadLater: !isReadLater,
            },
          }));
          toast.error(t("errors.actionFailed"), {
            description: t("errors.tryAgain"),
            position: "bottom-right",
          });
          console.error("Daha sonra oku değiştirme başarısız:", error);
        }
      }
    },
    [onToggleReadLater, t]
  );

  // Hata durumu
  if (isError) {
    return (
      <ErrorState
        error={error}
        onRetry={onRetry}
        title={t(`${cardType}.errorTitle`)}
        description={t(`${cardType}.errorDescription`)}
      />
    );
  }

  // Boş durum
  if (!isLoading && (!items || items.length === 0)) {
    return (
      <EmptyState
        title={emptyTitle || t(`${cardType}.emptyTitle`)}
        description={emptyDescription || t(`${cardType}.emptyDescription`)}
        icon={emptyIcon}
      />
    );
  }

  // Yükleme durumu
  if (isLoading) {
    return <LoadingState viewMode={viewMode} title={loadingTitle} />;
  }

  // İçerik listesini render et
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={`content-${cardType}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className={
          viewMode === "list"
            ? "space-y-4 flex flex-col w-full gap-4"
            : "space-y-4 md:space-y-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-5"
        }
      >
        {Array.isArray(items) &&
          items.map((item) => {
            // Optimistik güncelleme için durumları
            const optimisticState = optimisticStates[item.id];
            const isFavorite =
              optimisticState?.isFavorite !== undefined
                ? optimisticState.isFavorite
                : item.is_favorite;
            const isReadLater =
              optimisticState?.isReadLater !== undefined
                ? optimisticState.isReadLater
                : item.is_read_later;

            return (
              <ContentCard
                key={item?.id || `item-${Math.random()}`}
                item={{
                  ...item,
                  is_favorite: isFavorite,
                  is_read_later: isReadLater,
                }}
                viewMode={viewMode}
                cardType={cardType}
                isFavorite={isFavorite}
                isReadLater={isReadLater}
                onClick={(url) => handleItemClick(url, item)}
                onFavorite={() => handleToggleFavorite(item.id, !isFavorite)}
                onReadLater={() => {
                  // Daha sonra oku sayfasında, öğeyi listeden kaldırmak için false değeri kullan
                  const newValue =
                    cardType === "readLater" ? false : !isReadLater;
                  handleToggleReadLater(item.id, newValue);
                }}
                onShare={() => handleShareItem(item)}
              />
            );
          })}
      </motion.div>
    </AnimatePresence>
  );
});

export { ContentList };
