"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedService } from "@/services/feedService";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Feed servisi ile etkileşim için merkezi hook.
 * Tüm feed işlemleri için tek bir giriş noktası sağlar.
 */
export function useFeedService() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const userId = user?.id;

  // Cache ayarları
  const STALE_TIME = 1000 * 60 * 2; // 2 dakika
  const CACHE_TIME = 1000 * 60 * 60; // 60 dakika

  // Feed listesini getir
  const {
    data: feeds,
    isLoading: isLoadingFeeds,
    isError: isErrorFeeds,
    error: feedsError,
    refetch: refetchFeeds,
  } = useQuery({
    queryKey: ["feeds", userId],
    queryFn: () => feedService.getFeeds(userId),
    enabled: !!userId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Feed öğelerini getir
  const {
    data: items,
    isLoading: isLoadingItems,
    isError: isErrorItems,
    error: itemsError,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ["feedItems", feeds?.map((feed) => feed?.id)],
    queryFn: () => feedService.getFeedItems(feeds?.map((feed) => feed?.id)),
    enabled: !!feeds && feeds.length > 0,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Favori öğeleri getir
  const {
    data: favorites,
    isLoading: isLoadingFavorites,
    refetch: refetchFavorites,
  } = useQuery({
    queryKey: ["favorites", userId],
    queryFn: () => feedService.getFavorites(userId),
    enabled: !!userId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Daha sonra oku listesini getir
  const {
    data: readLaterItems,
    isLoading: isLoadingReadLater,
    refetch: refetchReadLater,
  } = useQuery({
    queryKey: ["readLater", userId],
    queryFn: () => feedService.getReadLaterItems(userId),
    enabled: !!userId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Tüm verileri yenile
  const refreshAll = useCallback(async () => {
    if (!userId) return;

    await Promise.all([
      refetchFeeds(),
      refetchItems(),
      refetchFavorites(),
      refetchReadLater(),
    ]);

    toast.success(t("feeds.refreshed"));
  }, [
    userId,
    refetchFeeds,
    refetchItems,
    refetchFavorites,
    refetchReadLater,
    t,
  ]);

  // Okuma durumunu değiştir
  const toggleReadMutation = useMutation({
    mutationFn: ({ itemId, isRead }) =>
      feedService.toggleItemReadStatus(userId, itemId, isRead),
    onSuccess: () => {
      // Cache'i güncelleme opsiyonel
    },
    onError: (error) => {
      console.error("Okuma durumu güncelleme hatası:", error);
      toast.error(t("errors.updateFailed"));
    },
  });

  // Favori durumunu değiştir
  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ itemId, isFavorite }) =>
      feedService.toggleItemFavoriteStatus(userId, itemId, isFavorite),
    onSuccess: () => {
      // Cache'i güncelle - UI güncellemesi için önemli
      queryClient.invalidateQueries(["feedItems"]);
      queryClient.invalidateQueries(["favorites"]);
    },
    onError: (error) => {
      console.error("Favori durumu güncelleme hatası:", error);
      toast.error(t("errors.updateFailed"));
    },
  });

  // Daha sonra oku durumunu değiştir
  const toggleReadLaterMutation = useMutation({
    mutationFn: ({ itemId, isReadLater }) =>
      feedService.toggleItemReadLaterStatus(userId, itemId, isReadLater),
    onSuccess: () => {
      // Cache'i güncelle - UI güncellemesi için önemli
      queryClient.invalidateQueries(["feedItems"]);
      queryClient.invalidateQueries(["readLater"]);
    },
    onError: (error) => {
      console.error("Daha sonra oku durumu güncelleme hatası:", error);
      toast.error(t("errors.updateFailed"));
    },
  });

  // Helper fonksiyonlar
  const toggleRead = useCallback(
    (itemId, isRead) => {
      if (!userId) return;
      toggleReadMutation.mutate({ itemId, isRead });
    },
    [userId, toggleReadMutation]
  );

  const toggleFavorite = useCallback(
    (itemId, isFavorite) => {
      if (!userId) return;
      toggleFavoriteMutation.mutate({ itemId, isFavorite });
    },
    [userId, toggleFavoriteMutation]
  );

  const toggleReadLater = useCallback(
    (itemId, isReadLater) => {
      if (!userId) return;
      toggleReadLaterMutation.mutate({ itemId, isReadLater });
    },
    [userId, toggleReadLaterMutation]
  );

  return {
    // Veriler
    feeds,
    items,
    favorites,
    readLaterItems,

    // Yükleme durumları
    isLoading: isLoadingFeeds || isLoadingItems,
    isLoadingFeeds,
    isLoadingItems,
    isLoadingFavorites,
    isLoadingReadLater,

    // Hata durumları
    isError: isErrorFeeds || isErrorItems,
    error: feedsError || itemsError,

    // Yenileme fonksiyonları
    refreshAll,
    refetchFeeds,
    refetchItems,
    refetchFavorites,
    refetchReadLater,

    // Etkileşim fonksiyonları
    toggleRead,
    toggleFavorite,
    toggleReadLater,

    // Mutation durumları
    isTogglingRead: toggleReadMutation.isPending,
    isTogglingFavorite: toggleFavoriteMutation.isPending,
    isTogglingReadLater: toggleReadLaterMutation.isPending,
  };
}
