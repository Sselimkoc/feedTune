"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

// Supabase client'ı oluştur
const createSupabaseClient = () => createClientComponentClient();

export function useFeedOperations() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  // RSS Feed Ekleme
  const { mutate: addRssFeed, isLoading: isAddingRss } = useMutation({
    mutationFn: async ({ url, userId }) => {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase.functions.invoke("add-rss-feed", {
        body: { url, userId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds"]);
      toast.success(t("feed.addSuccess"));
    },
    onError: (error) => {
      console.error("Error adding RSS feed:", error);
      toast.error(t("feed.addError"));
    },
  });

  // YouTube Feed Ekleme
  const { mutate: addYoutubeFeed, isLoading: isAddingYoutube } = useMutation({
    mutationFn: async ({ channelId, userId }) => {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase.functions.invoke(
        "add-youtube-feed",
        {
          body: { channelId, userId },
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds"]);
      toast.success(t("feed.addSuccess"));
    },
    onError: (error) => {
      console.error("Error adding YouTube feed:", error);
      toast.error(t("feed.addError"));
    },
  });

  // Feed Silme
  const { mutate: deleteFeed, isLoading: isDeleting } = useMutation({
    mutationFn: async (feedId) => {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from("feeds")
        .update({ is_active: false })
        .eq("id", feedId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds"]);
      toast.success(t("feed.deleteSuccess"));
    },
    onError: (error) => {
      console.error("Error deleting feed:", error);
      toast.error(t("feed.deleteError"));
    },
  });

  return {
    addRssFeed,
    addYoutubeFeed,
    deleteFeed,
    isAddingRss,
    isAddingYoutube,
    isDeleting,
  };
}
