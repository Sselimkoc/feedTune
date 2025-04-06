"use client";

import { useState, useEffect, useMemo } from "react";
import { useFeedService } from "./useFeedService";

/**
 * Ana sayfa için özelleştirilmiş feed hook'u
 * @returns {Object} Ana sayfa içerikleri ve fonksiyonları
 */
export function useHomeFeeds() {
  const [stats, setStats] = useState({
    totalFeeds: 0,
    totalUnread: 0,
    totalFavorites: 0,
    totalReadLater: 0,
  });

  // Ana feed servisini kullan
  const {
    feeds,
    items,
    favorites,
    readLaterItems,
    isLoading,
    isError,
    error,
    refreshAll,
    toggleRead,
    toggleFavorite,
    toggleReadLater,
  } = useFeedService();

  // İstatistikleri hesapla
  useEffect(() => {
    if (feeds && items && favorites && readLaterItems) {
      setStats({
        totalFeeds: feeds.length || 0,
        totalUnread: items?.filter((item) => !item.is_read)?.length || 0,
        totalFavorites: favorites?.length || 0,
        totalReadLater: readLaterItems?.length || 0,
      });
    }
  }, [feeds, items, favorites, readLaterItems]);

  // Son eklenen öğeleri al (tüm feed'lerden en son 10 öğe)
  const recentItems = useMemo(() => {
    if (!items) return [];

    return items
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
      .slice(0, 10);
  }, [items]);

  // Feed'leri kategorilere ayır
  const categorizedFeeds = useMemo(() => {
    if (!feeds) return { rssFeeds: [], youtubeFeeds: [] };

    return {
      rssFeeds: feeds.filter((feed) => feed.type === "rss"),
      youtubeFeeds: feeds.filter((feed) => feed.type === "youtube"),
    };
  }, [feeds]);

  return {
    // Veri durumları
    feeds,
    recentItems,
    stats,
    categorizedFeeds,
    isLoading,
    isError,
    error,

    // Ana fonksiyonlar
    refresh: refreshAll,
    toggleRead,
    toggleFavorite,
    toggleReadLater,
  };
}
