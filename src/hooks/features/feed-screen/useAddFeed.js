"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/core/ui/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";
import { useFeedService } from "@/hooks/features/useFeedService";
import { youtubeService } from "@/lib/youtube/service";
import { feedService } from "@/services/feedService";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Custom hook to manage feed addition dialog state and operations
 * @param {Function} onSuccess - Optional callback when a feed is successfully added
 * @returns {Object} - Methods and state for feed addition
 */
export function useAddFeed(onSuccess = () => {}) {
  const { t } = useTranslation();
  const { user, isLoading: isLoadingUser } = useAuth();
  const userId = user?.id;
  const { refreshAllFeeds } = useFeedService();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t: langT } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  /**
   * Toggle dialog visibility
   * @param {boolean} open - Whether to open or close the dialog
   */
  const toggleDialog = useCallback(
    (open) => {
      setIsDialogOpen(typeof open === "boolean" ? open : !isDialogOpen);
    },
    [isDialogOpen]
  );

  /**
   * Open the feed addition dialog
   */
  const openAddFeedDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  /**
   * Close the feed addition dialog
   */
  const closeAddFeedDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  /**
   * Add a feed by URL
   * @param {string} url - The URL of the feed to add
   * @param {string} type - The type of feed (rss, youtube)
   * @param {Object} extraData - Additional data for the feed
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  const addFeed = useCallback(
    async (url, type = "rss", extraData = {}) => {
      if (!url?.trim()) {
        toast({
          title: t("common.error"),
          description: t("errors.invalidUrl"),
          variant: "destructive",
        });
        return false;
      }

      if (!userId) {
        toast({
          title: t("errors.authRequired"),
          description: t("errors.pleaseLoginToAddFeeds"),
          variant: "destructive",
        });
        return false;
      }

      setIsLoading(true);

      try {
        // Call the feed service to add the feed
        await feedService.addFeed(url, type, userId, extraData);
        toast({
          title: t("common.success"),
          description: t("feeds.addSuccess"),
          variant: "default",
        });

        // Call the success callback
        if (typeof onSuccess === "function") {
          onSuccess();
        }

        return true;
      } catch (error) {
        console.error("Error adding feed:", error);

        // Provide specific error messages
        let errorMessage = error.message;

        if (errorMessage.includes("already")) {
          toast({
            title: t("common.error"),
            description: t("feeds.alreadyExists"),
            variant: "destructive",
          });
        } else if (
          errorMessage.includes("invalid") ||
          errorMessage.includes("parse")
        ) {
          toast({
            title: t("common.error"),
            description: t("feeds.invalidFeed"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("common.error"),
            description: t("feeds.addError"),
            variant: "destructive",
          });
        }

        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, feedService, onSuccess, t, toast]
  );

  /**
   * Handle successful feed addition from dialog
   */
  const handleFeedAdded = useCallback(() => {
    // Call the success callback
    if (typeof onSuccess === "function") {
      onSuccess();
    }
  }, [onSuccess]);

  return {
    isDialogOpen,
    isLoading,
    toggleDialog,
    openAddFeedDialog,
    closeAddFeedDialog,
    addFeed,
    handleFeedAdded,
  };
}
