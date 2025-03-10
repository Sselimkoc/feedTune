"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { useCallback, useState, useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFeedData } from "./useFeedData";
import { useFeedOperations } from "./useFeedOperations";
import { useFeedItems } from "./useFeedItems";

// Sabitler
const STALE_TIME = 1000 * 60 * 5; // 5 dakika
const CACHE_TIME = 1000 * 60 * 30; // 30 dakika
const ITEMS_PER_FEED = 10; // Her feed için maksimum öğe sayısı

// Yardımcı fonksiyonlar
export const limitItemsPerFeed = (feeds, items) => {
  if (!feeds || !items) return { feeds: [], items: [] };

  const itemsByFeed = items.reduce((acc, item) => {
    if (!acc[item.feed_id]) {
      acc[item.feed_id] = [];
    }
    acc[item.feed_id].push(item);
    return acc;
  }, {});

  const limitedItems = [];
  Object.entries(itemsByFeed).forEach(([feedId, feedItems]) => {
    limitedItems.push(...feedItems.slice(0, ITEMS_PER_FEED));
  });

  return { feeds, items: limitedItems };
};

// Supabase client'ı oluştur
const createSupabaseClient = () => createClientComponentClient();

// Veri çekme fonksiyonları
export const fetchFeeds = async (userId) => {
  const supabase = createSupabaseClient();
  // Tüm feed türlerini tek bir sorguda çek
  const { data, error } = await supabase
    .from("feeds")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

export const fetchFeedItems = async (feedIds) => {
  if (!feedIds || feedIds.length === 0) return [];

  const supabase = createSupabaseClient();

  // Her feed için ayrı ayrı sorgu yap ve her birinden sadece 10 öğe al
  const promises = feedIds.map(async (feedId) => {
    const { data, error } = await supabase
      .from("feed_items")
      .select("*")
      .eq("feed_id", feedId)
      .order("published_at", { ascending: false })
      .limit(ITEMS_PER_FEED);

    if (error) throw new Error(error.message);
    return data;
  });

  // Tüm sorguların sonuçlarını bekle ve birleştir
  const results = await Promise.all(promises);
  return results.flat();
};

export const fetchUserInteractions = async (userId, itemIds) => {
  if (!userId || !itemIds || itemIds.length === 0) return [];

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("user_item_interactions")
    .select("*")
    .eq("user_id", userId)
    .in("item_id", itemIds);

  if (error) throw new Error(error.message);
  return data;
};

export const fetchFavorites = async (userId) => {
  if (!userId) return [];

  const supabase = createSupabaseClient();

  try {
    // Önce kullanıcının favori etkileşimlerini al
    const { data: interactions, error: interactionsError } = await supabase
      .from("user_item_interactions")
      .select("item_id")
      .eq("user_id", userId)
      .eq("is_favorite", true);

    if (interactionsError) throw interactionsError;

    if (!interactions || interactions.length === 0) {
      return [];
    }

    // Ardından bu öğelerin detaylarını al
    const itemIds = interactions.map((interaction) => interaction.item_id);
    const { data: items, error: itemsError } = await supabase
      .from("feed_items")
      .select(
        `
        *,
        feeds:feed_id (
          id,
          title,
          site_favicon,
          type
        )
      `
      )
      .in("id", itemIds)
      .order("published_at", { ascending: false });

    if (itemsError) throw itemsError;

    // Etkileşim bilgilerini öğelere ekle
    const itemsWithInteractions = items.map((item) => ({
      ...item,
      is_favorite: true, // Zaten favorilerde olduğunu biliyoruz
      feed_title: item.feeds?.title || "Bilinmeyen Kaynak",
      feed_type: item.feeds?.type || "rss",
      site_favicon: item.feeds?.site_favicon || null,
    }));

    return itemsWithInteractions;
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
};

export const fetchReadLaterItems = async (userId) => {
  if (!userId) return [];

  const supabase = createSupabaseClient();

  try {
    // Önce kullanıcının okuma listesi etkileşimlerini al
    const { data: interactions, error: interactionsError } = await supabase
      .from("user_item_interactions")
      .select("item_id")
      .eq("user_id", userId)
      .eq("is_read_later", true);

    if (interactionsError) throw interactionsError;

    if (!interactions || interactions.length === 0) {
      return [];
    }

    // Ardından bu öğelerin detaylarını al
    const itemIds = interactions.map((interaction) => interaction.item_id);
    const { data: items, error: itemsError } = await supabase
      .from("feed_items")
      .select(
        `
        *,
        feeds:feed_id (
          id,
          title,
          site_favicon,
          type
        )
      `
      )
      .in("id", itemIds)
      .order("published_at", { ascending: false });

    if (itemsError) throw itemsError;

    // Etkileşim bilgilerini öğelere ekle
    const itemsWithInteractions = items.map((item) => ({
      ...item,
      is_read_later: true, // Zaten okuma listesinde olduğunu biliyoruz
      feed_title: item.feeds?.title || "Bilinmeyen Kaynak",
      feed_type: item.feeds?.type || "rss",
      site_favicon: item.feeds?.site_favicon || null,
    }));

    return itemsWithInteractions;
  } catch (error) {
    console.error("Error fetching read later items:", error);
    return [];
  }
};

// YouTube öğeleri de feed_items tablosunda saklandığı için aynı fonksiyonu kullanabiliriz
export const fetchYoutubeItems = fetchFeedItems;

// Ana hook
export function useFeeds() {
  const { user } = useAuthStore();
  const feedData = useFeedData();
  const feedOperations = useFeedOperations();
  const feedItems = useFeedItems();

  return {
    // Feed verisi
    feeds: feedData.feeds,
    items: feedData.items,
    isLoading: feedData.isLoading,
    isError: feedData.isError,
    error: feedData.error,
    refetch: feedData.refetch,

    // Feed işlemleri
    addRssFeed: (url) => feedOperations.addRssFeed({ url, userId: user?.id }),
    addYoutubeFeed: (channelId) =>
      feedOperations.addYoutubeFeed({ channelId, userId: user?.id }),
    deleteFeed: feedOperations.deleteFeed,
    isAddingRss: feedOperations.isAddingRss,
    isAddingYoutube: feedOperations.isAddingYoutube,
    isDeleting: feedOperations.isDeleting,

    // Öğe işlemleri
    toggleItemRead: (itemId, isRead) =>
      feedItems.toggleItemRead({ itemId, isRead, userId: user?.id }),
    toggleItemFavorite: (itemId, isFavorite) =>
      feedItems.toggleItemFavorite({ itemId, isFavorite, userId: user?.id }),
    toggleItemReadLater: (itemId, isReadLater) =>
      feedItems.toggleItemReadLater({ itemId, isReadLater, userId: user?.id }),
    isTogglingRead: feedItems.isTogglingRead,
    isTogglingFavorite: feedItems.isTogglingFavorite,
    isTogglingReadLater: feedItems.isTogglingReadLater,
  };
}
