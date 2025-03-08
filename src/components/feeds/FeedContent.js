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
    <div className="min-h-0">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold">Tüm Beslemeler</h2>
        <AddFeedDialog>
          <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-full transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-plus-circle"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8" />
              <path d="M12 8v8" />
            </svg>
            Feed Ekle
          </button>
        </AddFeedDialog>
      </div>

      <FeedList
        onRemoveFeed={removeFeed}
        onToggleRead={toggleItemRead}
        onToggleFavorite={toggleItemFavorite}
      />
    </div>
  );
}
