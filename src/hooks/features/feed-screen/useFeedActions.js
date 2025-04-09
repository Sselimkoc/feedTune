"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useRouter } from "next/navigation";

export function useFeedActions({ user, feedService, refreshAll }) {
  const { t } = useLanguage();
  const router = useRouter();
  const userId = user?.id;

  // Feed senkronizasyonu
  const syncFeeds = useCallback(async () => {
    if (!user) {
      toast.error(t("errors.loginRequired"));
      return;
    }

    try {
      const response = await fetch("/api/feed-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t("feeds.syncError"));
      }

      const data = await response.json().catch(() => ({}));
      toast.success(data.message || t("feeds.syncSuccess"));

      if (refreshAll) {
        await refreshAll();
      }

      router.refresh();
      return data;
    } catch (error) {
      console.error("Feed senkronizasyon hatası:", error);
      toast.error(error.message || t("feeds.syncError"));
      throw error;
    }
  }, [user, refreshAll, router, t]);

  // Feed ekleme
  const addFeed = useCallback(async (url, type) => {
    if (!userId) {
      toast.error(t("errors.loginRequired"));
      return;
    }

    try {
      await feedService.addFeed(url, type);
      toast.success(t("feeds.addFeedSuccess"));
      return true;
    } catch (error) {
      console.error("Feed ekleme hatası:", error);
      toast.error(error.message || t("feeds.addFeedError"));
      throw error;
    }
  }, [userId, feedService, t]);

  // Feed silme
  const removeFeed = useCallback(async (feedId) => {
    if (!userId || !feedId) {
      toast.error(t("errors.loginRequired"));
      return;
    }

    try {
      await feedService.deleteFeed(feedId);
      toast.success(t("feeds.deleteFeedSuccess"));
      return true;
    } catch (error) {
      console.error("Feed silme hatası:", error);
      toast.error(t("feeds.deleteFeedError"));
      throw error;
    }
  }, [userId, feedService, t]);

  // Tüm öğeleri okundu olarak işaretle
  const markAllRead = useCallback(async (items, feedId = null) => {
    if (!userId) {
      toast.error(t("errors.loginRequired"));
      return;
    }

    try {
      const itemsToMark = feedId
        ? items.filter(item => item.feed_id === feedId && !item.is_read)
        : items.filter(item => !item.is_read);

      if (itemsToMark.length === 0) {
        toast.info(t("feeds.noUnreadItems"));
        return;
      }

      const promises = itemsToMark.map(item => feedService.toggleRead(item.id, true));
      await Promise.all(promises);
      return itemsToMark.length;
    } catch (error) {
      console.error("Toplu okundu işaretleme hatası:", error);
      toast.error(t("feeds.markAllReadError"));
      throw error;
    }
  }, [userId, feedService, t]);

  // Öğe paylaşma
  const shareItem = useCallback((item) => {
    if (!item) return;

    try {
      if (navigator.share) {
        navigator.share({
          title: item.title,
          text: item.description || item.title,
          url: item.url || item.link,
        });
      } else {
        navigator.clipboard.writeText(item.url || item.link);
        toast.success(t("feeds.urlCopied"));
      }
    } catch (error) {
      console.error("Paylaşım hatası:", error);
      toast.error(t("feeds.shareError"));
    }
  }, [t]);

  return {
    syncFeeds,
    addFeed,
    removeFeed,
    markAllRead,
    shareItem,
  };
} 