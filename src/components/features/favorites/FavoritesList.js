"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FavoriteItem } from "./FavoriteItem";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";

export const FavoritesList = memo(function FavoritesList({
  initialItems = [],
  isLoading,
  viewMode,
  onToggleRead,
  onToggleFavorite,
  onToggleReadLater,
  onShare,
}) {
  const { t } = useLanguage();
  const [items, setItems] = useState(initialItems);
  const prevItemsRef = useRef(initialItems);

  useEffect(() => {
    if (isLoading) return;
    if (initialItems !== prevItemsRef.current) {
      setItems(initialItems);
      prevItemsRef.current = initialItems;
    }
  }, [isLoading, initialItems]);

  const handleToggleRead = useCallback(
    async (itemId) => {
      try {
        const updatedItems = items.map((item) =>
          item.id === itemId ? { ...item, isRead: !item.isRead } : item
        );
        setItems(updatedItems);
        await onToggleRead(itemId);
      } catch (error) {
        toast.error(t("errors.toggleReadFailed"));
        setItems(items);
      }
    },
    [items, onToggleRead, t]
  );

  const handleToggleFavorite = useCallback(
    async (itemId) => {
      try {
        const updatedItems = items.filter((item) => item.id !== itemId);
        setItems(updatedItems);
        await onToggleFavorite(itemId);
      } catch (error) {
        toast.error(t("errors.toggleFavoriteFailed"));
        setItems(items);
      }
    },
    [items, onToggleFavorite, t]
  );

  const handleToggleReadLater = useCallback(
    async (itemId) => {
      try {
        const updatedItems = items.map((item) =>
          item.id === itemId
            ? { ...item, isReadLater: !item.isReadLater }
            : item
        );
        setItems(updatedItems);
        await onToggleReadLater(itemId);
      } catch (error) {
        toast.error(t("errors.toggleReadLaterFailed"));
        setItems(items);
      }
    },
    [items, onToggleReadLater, t]
  );

  const handleShare = useCallback(
    async (itemId) => {
      try {
        await onShare(itemId);
      } catch (error) {
        toast.error(t("errors.shareFailed"));
      }
    },
    [onShare, t]
  );

  return (
    <motion.div
      layout
      className={`grid gap-4 ${
        viewMode === "grid"
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1"
      }`}
    >
      <AnimatePresence mode="popLayout">
        {Array.isArray(items) &&
          items.map((item) => (
            <FavoriteItem
              key={item?.id || `favorite-${Math.random()}`}
              item={item}
              viewMode={viewMode}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
              onToggleReadLater={() => handleToggleReadLater(item.id)}
              onShare={() => handleShare(item.id)}
            />
          ))}
      </AnimatePresence>
    </motion.div>
  );
});
