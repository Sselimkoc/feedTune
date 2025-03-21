"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRssFeeds } from "@/hooks/features/useRssFeeds";
import { useYoutubeFeeds } from "@/hooks/features/useYoutubeFeeds";

export function useFeedOperations() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { addRssFeed, deleteRssFeed } = useRssFeeds();
  const { addYoutubeChannel, deleteYoutubeChannel } = useYoutubeFeeds();

  // RSS Feed Ekleme (eskisine yönlendirme)
  const { isLoading: isAddingRss } = useMutation({
    mutationFn: async ({ url }) => {
      return await addRssFeed(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds"]);
      toast.success(t("feeds.addRssFeed.success"));
    },
    onError: (error) => {
      console.error("Error adding RSS feed:", error);
      toast.error(error.message || t("feeds.addRssFeed.error"));
    },
  });

  // YouTube Feed Ekleme (eskisine yönlendirme)
  const { isLoading: isAddingYoutube } = useMutation({
    mutationFn: async ({ channelId }) => {
      return await addYoutubeChannel(channelId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds"]);
      toast.success(t("feeds.addYoutubeFeed.success"));
    },
    onError: (error) => {
      console.error("Error adding YouTube feed:", error);
      toast.error(error.message || t("feeds.addYoutubeFeed.error"));
    },
  });

  // Feed Silme (feed türüne göre ilgili API'ye yönlendirme)
  const { mutate: deleteFeed, isLoading: isDeleting } = useMutation({
    mutationFn: async ({ feedId, feedType }) => {
      if (feedType === "rss") {
        return await deleteRssFeed(feedId);
      } else if (feedType === "youtube") {
        return await deleteYoutubeChannel(feedId);
      } else {
        throw new Error("Desteklenmeyen besleme türü");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds"]);
      toast.success(t("feeds.deleteFeed.success"));
    },
    onError: (error) => {
      console.error("Error deleting feed:", error);
      toast.error(error.message || t("feeds.deleteFeed.error"));
    },
  });

  return {
    addRssFeed,
    addYoutubeFeed: addYoutubeChannel,
    deleteFeed,
    isAddingRss,
    isAddingYoutube,
    isDeleting,
  };
}
