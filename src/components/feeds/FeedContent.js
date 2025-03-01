"use client";

import { useFeeds } from "@/hooks/useFeeds";
import { AddFeedDialog } from "@/components/feeds/AddFeedDialog";
import { FeedList } from "@/components/feeds/FeedList";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";

export function FeedContent() {
  const { addRssFeed, addYoutubeFeed } = useFeeds();
  const supabase = createClientComponentClient();

  const addFeed = async (feed) => {
    try {
      const { data: newFeed, error: feedError } = await supabase
        .from("feeds")
        .insert([feed])
        .select()
        .single();

      if (feedError) throw feedError;

      toast.success("Feed added successfully");
    } catch (error) {
      console.error("Error adding feed:", error);
      toast.error("Failed to add feed");
    }
  };

  const removeFeed = async (feedId) => {
    try {
      const { error } = await supabase
        .from("feeds")
        .delete()
        .match({ id: feedId });

      if (error) throw error;

      toast.success("Feed removed successfully");
    } catch (error) {
      console.error("Error removing feed:", error);
      toast.error("Failed to remove feed");
    }
  };

  const toggleItemRead = async (itemId, isRead) => {
    try {
      const { error } = await supabase
        .from("feed_items")
        .update({ is_read: isRead })
        .eq("id", itemId);

      if (error) throw error;
    } catch (error) {
      toast.error("Failed to update item status");
    }
  };

  const toggleItemFavorite = async (itemId, isFavorite) => {
    try {
      const { error } = await supabase
        .from("feed_items")
        .update({ is_favorite: isFavorite })
        .eq("id", itemId);

      if (error) throw error;
    } catch (error) {
      toast.error("Failed to update favorite status");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex-1" />
        <AddFeedDialog onAddFeed={addRssFeed} />
      </div>

      <FeedList
        onRemoveFeed={removeFeed}
        onToggleRead={toggleItemRead}
        onToggleFavorite={toggleItemFavorite}
      />
    </div>
  );
}
