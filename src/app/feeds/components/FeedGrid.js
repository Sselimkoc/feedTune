"use client";

import { useState, useEffect, useRef, memo } from "react";
import FeedCard from "./FeedCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyFilterState } from "./EmptyFilterState";
import { Loader2 } from "lucide-react";

export function FeedGrid({
  items = [],
  feeds = [],
  viewMode = "grid",
  onToggleRead,
  onToggleFavorite,
  onToggleReadLater,
  isLoading = false,
}) {
  const { t } = useLanguage();
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const gridRef = useRef(null);
  const gridContainerRef = useRef(null);

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
          setFocusedIndex((prev) => {
            const nextIndex = prev < items.length - 1 ? prev + 1 : prev;
            scrollToItem(nextIndex);
            return nextIndex;
          });
          break;
        case "k": // Yukarı / önceki öğe
          e.preventDefault();
          setFocusedIndex((prev) => {
            const nextIndex = prev > 0 ? prev - 1 : prev;
            scrollToItem(nextIndex);
            return nextIndex;
          });
          break;
        case "o": // Öğeyi aç
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            window.open(
              items[focusedIndex].url || items[focusedIndex].link,
              "_blank"
            );
            if (!items[focusedIndex].is_read) {
              onToggleRead(items[focusedIndex].id, true);
            }
          }
          break;
        case "m": // Okundu/okunmadı olarak işaretle
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            onToggleRead(items[focusedIndex].id, !items[focusedIndex].is_read);
          }
          break;
        case "s": // Favorilere ekle/çıkar
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            onToggleFavorite(
              items[focusedIndex].id,
              !items[focusedIndex].is_favorite
            );
          }
          break;
        case "b": // Daha sonra oku listesine ekle/çıkar
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            onToggleReadLater(
              items[focusedIndex].id,
              !items[focusedIndex].is_read_later
            );
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, focusedIndex, onToggleRead, onToggleFavorite, onToggleReadLater]);

  // Odaklanılan elemana scroll
  const scrollToItem = (index) => {
    if (index < 0 || index >= items.length || !gridContainerRef.current) return;

    const container = gridContainerRef.current;
    const itemElement = container.children[index];

    if (!itemElement) return;

    const containerRect = container.getBoundingClientRect();
    const itemRect = itemElement.getBoundingClientRect();

    // Öğe container'ın görünür alanının dışındaysa scroll et
    if (itemRect.bottom > containerRect.bottom) {
      container.scrollTop += itemRect.bottom - containerRect.bottom + 16; // 16: margin
    } else if (itemRect.top < containerRect.top) {
      container.scrollTop -= containerRect.top - itemRect.top + 16; // 16: margin
    }
  };

  // İçerik yoksa boş durum göster
  if (items.length === 0) {
    return (
      <EmptyFilterState
        onResetFilters={() => {
          if (typeof window !== "undefined") {
            const allTabsButton = document.querySelector('[value="all"]');
            if (allTabsButton) {
              allTabsButton.click();
            }
          }
        }}
      />
    );
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

  // Yükleme durumu gösterimi
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Grid görünümü
  if (viewMode === "grid") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`grid-${items.length}`}
          ref={(el) => {
            gridRef.current = el;
            gridContainerRef.current = el;
          }}
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6"
        >
          {items.map((feedItem, index) => (
            <motion.div key={feedItem.id} variants={item} layout>
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
      </AnimatePresence>
    );
  }

  // Liste (kompakt) görünümü
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`list-${items.length}`}
        ref={(el) => {
          gridRef.current = el;
          gridContainerRef.current = el;
        }}
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col divide-y divide-border"
      >
        {items.map((feedItem, index) => (
          <motion.div key={feedItem.id} variants={item} layout>
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
    </AnimatePresence>
  );
}
