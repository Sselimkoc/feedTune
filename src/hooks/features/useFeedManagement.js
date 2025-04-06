"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/store/useAuthStore";
import { feedService } from "@/services/feedService";

/**
 * Feed yönetimi için özelleştirilmiş hook
 * Feed ekleme, silme ve güncelleme işlemlerini yönetir
 */
export function useFeedManagement() {
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // RSS Feed Ekleme
  const addRssFeedMutation = useMutation({
    mutationFn: async (url) => {
      setIsProcessing(true);
      try {
        // Gerçek servis çağrısı
        return await feedService.addRssFeed(url, user.id);
      } catch (error) {
        console.error("RSS Feed ekleme hatası:", error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds"]);
      toast.success(t("feeds.addRssFeed.success"));
    },
    onError: (error) => {
      console.error("RSS Feed ekleme hatası:", error);
      toast.error(error.message || t("feeds.addRssFeed.error"));
    },
  });

  // YouTube Feed Ekleme
  const addYoutubeFeedMutation = useMutation({
    mutationFn: async (channelId) => {
      setIsProcessing(true);
      try {
        // Gerçek servis çağrısı
        return await feedService.addYoutubeFeed(channelId, user.id);
      } catch (error) {
        console.error("YouTube Feed ekleme hatası:", error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds"]);
      toast.success(t("feeds.addYoutubeFeed.success"));
    },
    onError: (error) => {
      console.error("YouTube Feed ekleme hatası:", error);
      toast.error(error.message || t("feeds.addYoutubeFeed.error"));
    },
  });

  // Feed Silme
  const deleteFeedMutation = useMutation({
    mutationFn: async (feedId) => {
      setIsProcessing(true);
      try {
        if (!user || !user.id) {
          throw new Error("Kullanıcı oturumu bulunamadı");
        }

        // Gerçek servis çağrısı
        return await feedService.deleteFeed(feedId, user.id);
      } catch (error) {
        console.error("Feed silme hatası:", error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds"]);
      toast.success(t("feeds.deleteFeed.success"));
    },
    onError: (error) => {
      console.error("Feed silme hatası:", error);
      toast.error(error.message || t("feeds.deleteFeed.error"));
    },
  });

  // Helper fonksiyonlar
  const addRssFeed = useCallback(
    (url) => {
      if (!user) {
        toast.error(t("errors.loginRequired"));
        return Promise.reject("Kullanıcı oturumu gerekli");
      }
      return addRssFeedMutation.mutate(url);
    },
    [user, addRssFeedMutation, t]
  );

  const addYoutubeFeed = useCallback(
    (channelId) => {
      if (!user) {
        toast.error(t("errors.loginRequired"));
        return Promise.reject("Kullanıcı oturumu gerekli");
      }
      return addYoutubeFeedMutation.mutate(channelId);
    },
    [user, addYoutubeFeedMutation, t]
  );

  const deleteFeed = useCallback(
    (feedId) => {
      if (!user) {
        toast.error(t("errors.loginRequired"));
        return Promise.reject("Kullanıcı oturumu gerekli");
      }
      return deleteFeedMutation.mutate(feedId);
    },
    [user, deleteFeedMutation, t]
  );

  return {
    // Feed Yönetim Fonksiyonları
    addRssFeed,
    addYoutubeFeed,
    deleteFeed,

    // Durum
    isProcessing,
    isAdding: addRssFeedMutation.isPending || addYoutubeFeedMutation.isPending,
    isDeleting: deleteFeedMutation.isPending,
  };
}
