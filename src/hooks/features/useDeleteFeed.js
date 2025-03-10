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

      // 1. Feed'e ait tüm öğeleri bul
      const { data: feedItems, error: itemsError } = await supabase
        .from("feed_items")
        .select("id")
        .eq("feed_id", feedId);

      if (itemsError) {
        console.error("Feed öğeleri alınırken hata:", itemsError);
        toast.error(t("errors.general"), { id: toastId });
        return false;
      }

      // 2. Kullanıcı etkileşimlerini sil
      if (feedItems && feedItems.length > 0) {
        const itemIds = feedItems.map((item) => item.id);
        const { error: interactionsError } = await supabase
          .from("user_item_interactions")
          .delete()
          .in("item_id", itemIds);

        if (interactionsError) {
          console.error("Etkileşimler silinirken hata:", interactionsError);
          toast.error(t("errors.general"), { id: toastId });
          return false;
        }
      }

      // 3. Feed öğelerini sil
      const { error: deleteItemsError } = await supabase
        .from("feed_items")
        .delete()
        .eq("feed_id", feedId);

      if (deleteItemsError) {
        console.error("Feed öğeleri silinirken hata:", deleteItemsError);
        toast.error(t("errors.general"), { id: toastId });
        return false;
      }

      // 4. Feed'in türünü kontrol et ve ilgili tablodan sil
      const { data: feedData, error: feedTypeError } = await supabase
        .from("feeds")
        .select("type")
        .eq("id", feedId)
        .single();

      if (feedTypeError) {
        console.error("Feed türü alınırken hata:", feedTypeError);
        toast.error(t("errors.general"), { id: toastId });
        return false;
      }

      if (feedData.type === "rss") {
        const { error: rssError } = await supabase
          .from("rss_feeds")
          .delete()
          .eq("id", feedId);

        if (rssError) {
          console.error("RSS feed silinirken hata:", rssError);
          toast.error(t("errors.general"), { id: toastId });
          return false;
        }
      } else if (feedData.type === "youtube") {
        const { error: youtubeError } = await supabase
          .from("youtube_feeds")
          .delete()
          .eq("id", feedId);

        if (youtubeError) {
          console.error("YouTube feed silinirken hata:", youtubeError);
          toast.error(t("errors.general"), { id: toastId });
          return false;
        }
      }

      // 5. Ana feed'i sil
      const { error: deleteFeedError } = await supabase
        .from("feeds")
        .delete()
        .eq("id", feedId);

      if (deleteFeedError) {
        console.error("Feed silinirken hata:", deleteFeedError);
        toast.error(t("errors.general"), { id: toastId });
        return false;
      }

      toast.success(t("feeds.deleteFeed.success"), { id: toastId });
      if (onSuccess) onSuccess();
      return true;
    } catch (error) {
      console.error("Feed silme hatası:", error);
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
