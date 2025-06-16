"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { feedService } from "@/services/feedService";

export function useFeedManagement() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { toastSuccess, toastError, toastLoading } = useToast();

  const deleteFeed = useCallback(
    async (feedId) => {
      if (!feedId) {
        toastError(t("errors.invalidFeedId"));
        return false;
      }

      const toastId = "delete-feed";
      toastLoading(t("feeds.deleteFeed.deleting"), { id: toastId });

      try {
        await feedService.deleteFeed(feedId);
        await queryClient.invalidateQueries(["feeds"]);
        toastSuccess(t("feeds.deleteFeed.success"), { id: toastId });
        return true;
      } catch (error) {
        console.error("Error deleting feed:", error);
        toastError(error.message || t("feeds.deleteFeed.error"), {
          id: toastId,
        });
        return false;
      }
    },
    [queryClient, t, toastSuccess, toastError, toastLoading]
  );

  return {
    deleteFeed,
  };
}
