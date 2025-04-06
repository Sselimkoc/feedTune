"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export function useDeleteFeed() {
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClientComponentClient();
  const { t } = useLanguage();

  const handleRemoveFeed = async (feedId, onSuccess) => {
    try {
      setIsDeleting(true);
      const toastId = toast.loading(t("feeds.deleteFeed.deleting"));

      // Find all items in the feed
      const { data: feedItems, error: itemsError } = await supabase
        .from("feed_items")
        .select("id")
        .eq("feed_id", feedId);

      if (itemsError) {
        toast.error(t("errors.general"), { id: toastId });
        return false;
      }

      // Delete user interactions for the feed items
      if (feedItems && feedItems.length > 0) {
        const itemIds = feedItems.map((item) => item.id);
        const { error: interactionsError } = await supabase
          .from("user_item_interactions")
          .delete()
          .in("item_id", itemIds);

        if (interactionsError) {
          toast.error(t("errors.general"), { id: toastId });
          return false;
        }
      }

      // Delete feed items
      const { error: deleteItemsError } = await supabase
        .from("feed_items")
        .delete()
        .eq("feed_id", feedId);

      if (deleteItemsError) {
        toast.error(t("errors.general"), { id: toastId });
        return false;
      }

      // Check the feed type and delete from the relevant table
      const { data: feedData, error: feedTypeError } = await supabase
        .from("feeds")
        .select("type")
        .eq("id", feedId)
        .single();

      if (feedTypeError) {
        toast.error(t("errors.general"), { id: toastId });
        return false;
      }

      if (feedData.type === "rss") {
        const { error: rssError } = await supabase
          .from("rss_feeds")
          .delete()
          .eq("id", feedId);

        if (rssError) {
          toast.error(t("errors.general"), { id: toastId });
          return false;
        }
      } else if (feedData.type === "youtube") {
        const { error: youtubeError } = await supabase
          .from("youtube_feeds")
          .delete()
          .eq("id", feedId);

        if (youtubeError) {
          toast.error(t("errors.general"), { id: toastId });
          return false;
        }
      }

      // Delete the main feed
      const { error: deleteFeedError } = await supabase
        .from("feeds")
        .delete()
        .eq("id", feedId);

      if (deleteFeedError) {
        toast.error(t("errors.general"), { id: toastId });
        return false;
      }

      toast.success(t("feeds.deleteFeed.success"), { id: toastId });
      if (onSuccess) onSuccess();
      return true;
    } catch (error) {
      toast.error(t("feeds.deleteFeed.error"));
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    handleRemoveFeed,
  };
}
