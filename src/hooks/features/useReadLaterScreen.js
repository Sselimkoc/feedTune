"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useFeedItems } from "@/hooks/features/deprecated/useFeedItems";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/use-toast";
import { useFeedActions } from "@/hooks/features/feed-screen/useFeedActions";
import { useFeedService } from "@/hooks/features/useFeedService";

/**
 * Daha Sonra Oku ekranı için özelleştirilmiş hook
 * Bu hook, daha sonra okunacak içerikleri yönetmek için gerekli verileri ve fonksiyonları sağlar
 * @returns {Object} Daha sonra okunacak içeriklerle ilgili veriler ve fonksiyonlar
 */
export function useReadLaterScreen() {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const { handleFeedAction } = useFeedActions();
  const {
    readLaterItems: items,
    isLoading: isLoadingItems,
    error,
    toggleReadLater,
    toggleFavorite,
    toggleRead,
  } = useFeedService();

  const markAsRead = async (itemId) => {
    if (!user?.id) {
      toast({
        title: t("errors.authRequired"),
        description: t("errors.pleaseLoginToAddFeeds"),
        variant: "destructive",
      });
      return;
    }
    await handleFeedAction("markRead", itemId, user.id);
  };

  const markAsUnread = async (itemId) => {
    if (!user?.id) {
      toast({
        title: t("errors.authRequired"),
        description: t("errors.pleaseLoginToAddFeeds"),
        variant: "destructive",
      });
      return;
    }
    await handleFeedAction("markUnread", itemId, user.id);
  };

  const removeFromReadLater = async (itemId) => {
    if (!user?.id) {
      toast({
        title: t("errors.authRequired"),
        description: t("errors.pleaseLoginToAddFeeds"),
        variant: "destructive",
      });
      return;
    }
    await handleFeedAction("removeFromReadLater", itemId, user.id);
  };

  const markAllAsRead = async () => {
    if (!user?.id) {
      toast({
        title: t("errors.authRequired"),
        description: t("errors.pleaseLoginToAddFeeds"),
        variant: "destructive",
      });
      return;
    }
    await handleFeedAction("markAllAsRead", null, user.id);
  };

  return {
    items,
    isLoading: isLoadingItems || isLoading,
    error,
    markAsRead,
    markAsUnread,
    removeFromReadLater,
    markAllAsRead,
    toggleReadLater,
    toggleFavorite,
    toggleRead,
  };
}
