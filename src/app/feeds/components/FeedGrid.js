"use client";

import { useState, useEffect, useRef, memo } from "react";
import FeedCard from "./FeedCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { EmptyFilterState } from "./EmptyFilterState";

export function FeedGrid({
  items = [],
  feeds = [],
  viewMode = "grid",
  onToggleRead,
  onToggleFavorite,
  onToggleReadLater,
}) {
  const { t } = useLanguage();
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const gridRef = useRef(null);

  // Kompakt ve grid görünümü için klavye kısayolları
  useEffect(() => {
    if (!gridRef.current) return;

    const handleKeyDown = (e) => {
      // Eğer bir form elemanı odaktaysa kısayolları kullanma
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA" ||
        document.activeElement.tagName === "SELECT" ||
        document.activeElement.hasAttribute("contenteditable")
      ) {
        return;
      }

      switch (e.key) {
        case "j": // Aşağı / sonraki öğe
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev < items.length - 1 ? prev + 1 : prev
          );
          break;
        case "k": // Yukarı / önceki öğe
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "o": // Öğeyi aç
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            window.open(items[focusedIndex].url, "_blank");
            if (!items[focusedIndex].is_read) {
              onToggleRead(items[focusedIndex].id);
            }
          }
          break;
        case "m": // Okundu/okunmadı olarak işaretle
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            onToggleRead(items[focusedIndex].id);
          }
          break;
        case "s": // Favorilere ekle/çıkar
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            onToggleFavorite(items[focusedIndex].id);
          }
          break;
        case "b": // Daha sonra oku listesine ekle/çıkar
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            onToggleReadLater(items[focusedIndex].id);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, focusedIndex, onToggleRead, onToggleFavorite, onToggleReadLater]);

  // İçerik yoksa boş durum göster
  if (items.length === 0) {
    return <EmptyFilterState onResetFilters={() => {}} />;
  }

  // Feed ID'den feed nesnesini bul
  const getFeedById = (feedId) => {
    return feeds.find((feed) => feed.id === feedId) || null;
  };

  // Geçiş animasyonları için yapılandırma
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  // Grid görünümü
  if (viewMode === "grid") {
    return (
      <motion.div
        ref={gridRef}
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6"
      >
        {items.map((feedItem, index) => (
          <motion.div key={feedItem.id} variants={item}>
            <FeedCard
              item={feedItem}
              feed={getFeedById(feedItem.feed_id)}
              isCompact={false}
              onToggleRead={onToggleRead}
              onToggleFavorite={onToggleFavorite}
              onToggleReadLater={onToggleReadLater}
              isFocused={focusedIndex === index}
            />
          </motion.div>
        ))}
      </motion.div>
    );
  }

  // Liste (kompakt) görünümü
  return (
    <motion.div
      ref={gridRef}
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col divide-y divide-border"
    >
      {items.map((feedItem, index) => (
        <motion.div key={feedItem.id} variants={item}>
          <FeedCard
            item={feedItem}
            feed={getFeedById(feedItem.feed_id)}
            isCompact={true}
            onToggleRead={onToggleRead}
            onToggleFavorite={onToggleFavorite}
            onToggleReadLater={onToggleReadLater}
            isFocused={focusedIndex === index}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
