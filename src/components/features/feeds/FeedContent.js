"use client";

import { useFeeds } from "@/hooks/features/useFeeds";
import { FeedList } from "@/components/features/feeds/FeedList";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRssFeeds } from "@/hooks/features/useRssFeeds";
import { useYoutubeFeeds } from "@/hooks/features/useYoutubeFeeds";

export function FeedContent() {
  const { refetch } = useFeeds();
  const { addRssFeed, deleteRssFeed } = useRssFeeds();
  const { addYoutubeChannel, deleteYoutubeChannel } = useYoutubeFeeds();
  const supabase = createClientComponentClient();
  const { user } = useAuthStore();
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const { t, language } = useLanguage();

  const addFeed = async (url, feedType = "rss") => {
    if (!user?.id) {
      toast.error(t("errors.unauthorized"));
      return;
    }

    try {
      if (feedType === "rss") {
        await addRssFeed(url);
      } else if (feedType === "youtube") {
        await addYoutubeChannel(url);
      } else {
        toast.error(t("errors.unsupportedFeedType"));
      }
    } catch (error) {
      console.error(`Error adding ${feedType} feed:`, error);
    }
  };

  const removeFeed = async (feedId, feedType = "rss") => {
    try {
      if (!window.confirm(t("feeds.deleteFeed.confirmation"))) {
        return;
      }

      const toastId = toast.loading(t("feeds.deleteFeed.deleting"));

      try {
        if (feedType === "rss") {
          await deleteRssFeed(feedId);
        } else if (feedType === "youtube") {
          await deleteYoutubeChannel(feedId);
        } else {
          throw new Error(t("errors.unsupportedFeedType"));
        }

        toast.success(t("feeds.deleteFeed.success"), {
          id: toastId,
        });

        refetch();
      } catch (error) {
        console.error("Feed deletion error:", error);
        toast.error(t("feeds.deleteFeed.error"), { id: toastId });
      }
    } catch (error) {
      console.error("Feed silme işlemi sırasında hata:", error);
      toast.error(t("feeds.deleteFeed.error"));
    }
  };

  const toggleItemRead = async (itemId, isRead) => {
    if (!user) {
      toast.error(t("errors.unauthorized"));
      return;
    }

    try {
      const { data: existingInteraction, error: checkError } = await supabase
        .from("user_item_interactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .single();

      if (checkError && checkError.code !== "PGRST116") throw checkError;

      if (existingInteraction) {
        const { error } = await supabase
          .from("user_item_interactions")
          .update({ is_read: isRead })
          .eq("user_id", user.id)
          .eq("item_id", itemId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_item_interactions").insert([
          {
            user_id: user.id,
            item_id: itemId,
            is_read: isRead,
            is_favorite: false,
            is_read_later: false,
          },
        ]);

        if (error) throw error;
      }

      toast.success(
        isRead
          ? t("feeds.feedList.markAsRead")
          : t("feeds.feedList.markAsUnread"),
        {
          duration: 2000,
          position: "bottom-right",
        }
      );
    } catch (error) {
      console.error("Error updating item status:", error);
      toast.error(t("errors.general"));
    }
  };

  const toggleItemFavorite = async (itemId, isFavorite) => {
    if (!user) {
      toast.error(t("errors.unauthorized"));
      return;
    }

    try {
      const { data: existingInteraction, error: checkError } = await supabase
        .from("user_item_interactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .single();

      if (checkError && checkError.code !== "PGRST116") throw checkError;

      if (existingInteraction) {
        const { error } = await supabase
          .from("user_item_interactions")
          .update({ is_favorite: isFavorite })
          .eq("user_id", user.id)
          .eq("item_id", itemId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_item_interactions").insert([
          {
            user_id: user.id,
            item_id: itemId,
            is_read: false,
            is_favorite: isFavorite,
            is_read_later: false,
          },
        ]);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error updating favorite status:", error);
      toast.error(t("errors.general"));
    }
  };

  const toggleItemReadLater = async (itemId, isReadLater) => {
    if (!user) {
      toast.error(t("errors.unauthorized"));
      return;
    }

    try {
      const { data: existingInteraction, error: checkError } = await supabase
        .from("user_item_interactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .single();

      if (checkError && checkError.code !== "PGRST116") throw checkError;

      if (existingInteraction) {
        const { error } = await supabase
          .from("user_item_interactions")
          .update({ is_read_later: isReadLater })
          .eq("user_id", user.id)
          .eq("item_id", itemId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_item_interactions").insert([
          {
            user_id: user.id,
            item_id: itemId,
            is_read: false,
            is_favorite: false,
            is_read_later: isReadLater,
          },
        ]);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error updating read later status:", error);
      toast.error(t("errors.general"));
    }
  };

  return (
    <div className="w-full">
      {/* <div className="flex justify-end mb-6">
        <div className="flex items-center gap-2">
          <AddFeedButton />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowKeyboardHelp(true)}
            className="h-9 px-3"
          >
            <Keyboard className="h-4 w-4 mr-2" />
            <span className="text-sm">
              {t("feeds.keyboardShortcuts.title")}
            </span>
          </Button>
        </div>
      </div> */}

      <FeedList
        onRemoveFeed={removeFeed}
        onToggleRead={toggleItemRead}
        onToggleFavorite={toggleItemFavorite}
        onToggleReadLater={toggleItemReadLater}
      />
    </div>
  );
}
