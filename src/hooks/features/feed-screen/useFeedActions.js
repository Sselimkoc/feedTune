"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { feedService } from "@/services/feedService";

/**
 * Hook to handle common feed actions
 *
 * @param {Object} user - The current authenticated user
 * @param {Function} refreshFeeds - Function to refresh the feeds list
 * @param {Function} refreshFeedItems - Function to refresh feed items
 * @param {Object} feedService - The feed service instance
 * @returns {Object} - Feed action methods
 */
export function useFeedActions(
  user,
  refreshFeeds = () => {},
  refreshFeedItems = () => {},
  feedService
) {
  const { t } = useLanguage();
  const router = useRouter();
  const userId = user?.id;
  const localFeedService = feedService || feedService;

  /**
   * Add a new feed
   * @param {string} url - Feed URL
   * @param {string} type - Feed type (rss or youtube)
   * @param {Object} extraData - Additional feed data
   * @returns {Promise<boolean>} - Success status
   */
  const addFeed = useCallback(
    async (url, type = "rss", extraData = {}) => {
      if (!url?.trim()) {
        toast.error(t("error.invalidUrl"));
        return false;
      }

      if (!user) {
        toast.error(t("error.authRequired"));
        return false;
      }

      try {
        // Call the feed service to add the feed
        await localFeedService.addFeed(url, type, user.id, extraData);

        toast.success(t("success.feedAdded"));

        // Refresh feeds list
        if (refreshFeeds) {
          refreshFeeds();
        }

        return true;
      } catch (error) {
        console.error("Error adding feed:", error);

        // Handle specific error cases
        if (error.message.includes("already")) {
          toast.error(t("error.feedAlreadyExists"));
        } else if (
          error.message.includes("invalid") ||
          error.message.includes("parse")
        ) {
          toast.error(t("error.couldNotParseFeed"));
        } else {
          toast.error(error.message || t("error.unknownError"));
        }

        return false;
      }
    },
    [user, localFeedService, refreshFeeds, t]
  );

  /**
   * Remove a feed
   * @param {string} feedId - Feed ID
   * @returns {Promise<boolean>} - Success status
   */
  const removeFeed = useCallback(
    async (feedId) => {
      if (!feedId || !user) {
        return false;
      }

      try {
        await localFeedService.deleteFeed(feedId, user.id);
        toast.success(t("success.feedRemoved"));

        // Refresh feeds list
        if (refreshFeeds) {
          refreshFeeds();
        }

        return true;
      } catch (error) {
        console.error("Error removing feed:", error);
        toast.error(error.message || t("error.removeFeedFailed"));
        return false;
      }
    },
    [user, localFeedService, refreshFeeds, t]
  );

  /**
   * Synchronize a feed
   * @param {string} feedId - Feed ID
   * @returns {Promise<boolean>} - Success status
   */
  const syncFeed = useCallback(
    async (feedId) => {
      if (!feedId || !user) {
        return false;
      }

      try {
        const result = await localFeedService.syncFeedItems(feedId, user.id);

        if (result.success) {
          toast.success(t("success.feedSynced"));

          // Refresh feed items
          if (refreshFeedItems) {
            refreshFeedItems();
          }

          return true;
        } else {
          throw new Error(result.error || t("error.syncFailed"));
        }
      } catch (error) {
        console.error("Error syncing feed:", error);
        toast.error(error.message || t("error.syncFeedFailed"));
        return false;
      }
    },
    [user, localFeedService, refreshFeedItems, t]
  );

  /**
   * Toggle item read status
   * @param {string} itemId - Item ID
   * @param {boolean} isRead - Read status
   * @returns {Promise<boolean>} - Success status
   */
  const toggleRead = useCallback(
    async (itemId, isRead) => {
      if (!itemId || !user) {
        return false;
      }

      try {
        await localFeedService.toggleItemReadStatus(user.id, itemId, isRead);
        return true;
      } catch (error) {
        console.error("Error toggling read status:", error);
        return false;
      }
    },
    [user, localFeedService]
  );

  /**
   * Toggle item favorite status
   * @param {string} itemId - Item ID
   * @param {boolean} isFavorite - Favorite status
   * @returns {Promise<boolean>} - Success status
   */
  const toggleFavorite = useCallback(
    async (itemId, isFavorite) => {
      if (!itemId || !user) {
        return false;
      }

      try {
        await localFeedService.toggleItemFavoriteStatus(
          user.id,
          itemId,
          isFavorite
        );
        return true;
      } catch (error) {
        console.error("Error toggling favorite status:", error);
        return false;
      }
    },
    [user, localFeedService]
  );

  /**
   * Toggle item read later status
   * @param {string} itemId - Item ID
   * @param {boolean} isReadLater - Read later status
   * @returns {Promise<boolean>} - Success status
   */
  const toggleReadLater = useCallback(
    async (itemId, isReadLater) => {
      if (!itemId || !user) {
        return false;
      }

      try {
        await localFeedService.toggleItemReadLaterStatus(
          user.id,
          itemId,
          isReadLater
        );
        return true;
      } catch (error) {
        console.error("Error toggling read later status:", error);
        return false;
      }
    },
    [user, localFeedService]
  );

  /**
   * Mark multiple items as read
   * @param {Array<string>} itemIds - Array of item IDs
   * @returns {Promise<boolean>} - Success status
   */
  const markItemsAsRead = useCallback(
    async (itemIds) => {
      if (!itemIds?.length || !user) {
        return false;
      }

      try {
        const promises = itemIds.map((id) =>
          localFeedService.toggleItemReadStatus(user.id, id, true)
        );

        await Promise.all(promises);

        toast.success(
          itemIds.length === 1
            ? t("success.itemMarkedAsRead")
            : t("success.itemsMarkedAsRead", { count: itemIds.length })
        );

        return true;
      } catch (error) {
        console.error("Error marking items as read:", error);
        toast.error(t("error.markAsReadFailed"));
        return false;
      }
    },
    [user, localFeedService, t]
  );

  return {
    addFeed,
    removeFeed,
    syncFeed,
    toggleRead,
    toggleFavorite,
    toggleReadLater,
    markItemsAsRead,
  };
}
