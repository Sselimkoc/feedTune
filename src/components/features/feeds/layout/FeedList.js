"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FeedItem } from "./FeedItem";
import { cn } from "@/lib/utils";

export const FeedList = memo(function FeedList({
  items = [],
  viewMode = "grid",
  onItemClick,
  onToggleFavorite,
  onToggleReadLater,
  onShare,
}) {
  const containerClass = viewMode === "grid"
    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    : "flex flex-col gap-4";

  // Eğer items yoksa yükleniyor göster veya boş içerik state'i göster
  if (!items || items.length === 0) {
    return <div className="w-full text-center py-8">Gösterilecek içerik bulunamadı</div>;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={containerClass}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {items.map((item) => (
          <FeedItem
            key={item.id}
            item={item}
            viewMode={viewMode}
            isRead={item.isRead}
            isFavorite={item.isFavorite}
            isReadLater={item.isReadLater}
            onClick={() => onItemClick?.(item)}
            onFavorite={() => onToggleFavorite?.(item)}
            onReadLater={() => onToggleReadLater?.(item)}
            onShare={() => onShare?.(item)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
});
