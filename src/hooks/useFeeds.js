import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useCallback } from "react";

export function useFeeds() {
  const supabase = createClientComponentClient();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Prefetch function for feeds
  const prefetchFeeds = useCallback(async () => {
    if (!user) return;

    await queryClient.prefetchQuery({
      queryKey: ["feeds", user.id],
      queryFn: async () => {
        const { data: feedsData, error: feedsError } = await supabase
          .from("feeds")
          .select(
            `
            *,
            rss_feeds (*),
            youtube_feeds (*),
            feed_items (*)
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (feedsError) throw feedsError;

        return feedsData.map((feed) => ({
          ...feed,
          items: feed.feed_items || [],
          ...(feed.type === "rss" ? feed.rss_feeds[0] : {}),
          ...(feed.type === "youtube" ? feed.youtube_feeds[0] : {}),
        }));
      },
    });
  }, [user, queryClient, supabase]);

  const {
    data: feeds = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["feeds", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Ana feeds tablosundan verileri çek
      const { data: feedsData, error: feedsError } = await supabase
        .from("feeds")
        .select(
          `
          *,
          rss_feeds (*),
          youtube_feeds (*),
          feed_items (*)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (feedsError) throw feedsError;

      // Feed türüne göre verileri düzenle
      return feedsData.map((feed) => ({
        ...feed,
        items: feed.feed_items || [],
        ...(feed.type === "rss" ? feed.rss_feeds[0] : {}),
        ...(feed.type === "youtube" ? feed.youtube_feeds[0] : {}),
      }));
    },
    enabled: !!user, // Sadece user varsa query'yi çalıştır
  });

  const addRssFeed = async (feedData) => {
    const { data: feed, error: feedError } = await supabase
      .from("feeds")
      .insert({
        user_id: feedData.user_id,
        type: "rss",
        title: feedData.title,
        description: feedData.description,
      })
      .select()
      .single();

    if (feedError) throw feedError;

    // RSS feed detaylarını ekle
    const { error: rssError } = await supabase.from("rss_feeds").insert({
      id: feed.id,
      feed_url: feedData.feed_url,
      site_favicon: feedData.site_favicon,
    });

    if (rssError) throw rssError;

    // Feed itemlarını ekle
    if (feedData.items?.length > 0) {
      const { error: itemsError } = await supabase.from("feed_items").insert(
        feedData.items.map((item) => ({
          feed_id: feed.id,
          title: item.title,
          link: item.link,
          description: item.description,
          published_at: item.published_at,
        }))
      );

      if (itemsError) throw itemsError;
    }

    return feed;
  };

  const addYoutubeFeed = async (feedData) => {
    const { data: feed, error: feedError } = await supabase
      .from("feeds")
      .insert({
        user_id: feedData.user_id,
        type: "youtube",
        title: feedData.title,
        description: feedData.description,
      })
      .select()
      .single();

    if (feedError) throw feedError;

    // YouTube feed detaylarını ekle
    const { error: ytError } = await supabase.from("youtube_feeds").insert({
      id: feed.id,
      channel_id: feedData.channel_id,
      channel_avatar: feedData.channel_avatar,
      subscriber_count: feedData.subscriber_count,
      video_count: feedData.video_count,
      playlist_id: feedData.playlist_id,
    });

    if (ytError) throw ytError;

    // Feed itemlarını ekle
    if (feedData.items?.length > 0) {
      const { error: itemsError } = await supabase.from("feed_items").insert(
        feedData.items.map((item) => ({
          feed_id: feed.id,
          title: item.title,
          link: item.link,
          description: item.description,
          published_at: item.published_at,
          video_id: item.video_id,
          thumbnail: item.thumbnail,
        }))
      );

      if (itemsError) throw itemsError;
    }

    return feed;
  };

  const deleteFeed = async (feedId) => {
    const { error } = await supabase.from("feeds").delete().eq("id", feedId);

    if (error) throw error;
  };

  const toggleItemRead = async (itemId, isRead) => {
    const { error } = await supabase
      .from("feed_items")
      .update({ is_read: isRead })
      .eq("id", itemId);

    if (error) throw error;
  };

  const toggleItemFavorite = async (itemId, isFavorite) => {
    const { error } = await supabase
      .from("feed_items")
      .update({ is_favorite: isFavorite })
      .eq("id", itemId);

    if (error) throw error;
  };

  const addFeedMutation = useMutation({
    mutationFn: async (feedData) => {
      if (!user) throw new Error("You must be logged in to add a feed");

      if (feedData.type === "rss") {
        return await addRssFeed(feedData);
      } else if (feedData.type === "youtube") {
        return await addYoutubeFeed(feedData);
      } else {
        throw new Error("Invalid feed type");
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["feeds", user?.id] });
      toast.success(
        `${
          variables.type === "rss" ? "RSS feed" : "YouTube channel"
        } added successfully`
      );
    },
    onError: (error) => {
      let errorMessage = "Failed to add feed";

      if (error.message.includes("duplicate")) {
        errorMessage = "This feed is already in your list";
      } else if (error.message.includes("auth")) {
        errorMessage = "Please login to add feeds";
      } else if (error.message.includes("Invalid feed type")) {
        errorMessage = "Invalid feed type selected";
      }

      toast.error(errorMessage);
      console.error("Feed addition error:", error);
    },
  });

  const deleteFeedMutation = useMutation({
    mutationFn: async (feedId) => {
      if (!user) throw new Error("You must be logged in to delete a feed");
      return await deleteFeed(feedId);
    },
    onMutate: async (feedId) => {
      // Önceki sorguları iptal et
      await queryClient.cancelQueries({ queryKey: ["feeds", user?.id] });

      // Önceki state'i kaydet
      const previousFeeds = queryClient.getQueryData(["feeds", user?.id]);

      // Optimistic update - feed'i hemen kaldır
      queryClient.setQueryData(["feeds", user?.id], (old) => {
        return old.filter((feed) => feed.id !== feedId);
      });

      return { previousFeeds };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds", user?.id] });
      toast.success("Feed deleted successfully");
    },
    onError: (error, feedId, context) => {
      // Hata durumunda önceki state'e geri dön
      queryClient.setQueryData(["feeds", user?.id], context.previousFeeds);

      let errorMessage = "Failed to delete feed";

      if (error.message.includes("auth")) {
        errorMessage = "Please login to delete feeds";
      } else if (error.message.includes("not found")) {
        errorMessage = "Feed not found";
      }

      toast.error(errorMessage);
      console.error("Feed deletion error:", error);
    },
  });

  const toggleItemReadMutation = useMutation({
    mutationFn: ({ itemId, isRead }) => toggleItemRead(itemId, isRead),
    onMutate: async ({ itemId, isRead }) => {
      // Önceki sorguları iptal et
      await queryClient.cancelQueries({ queryKey: ["feeds", user?.id] });

      // Önceki state'i kaydet
      const previousFeeds = queryClient.getQueryData(["feeds", user?.id]);

      // Optimistic update
      queryClient.setQueryData(["feeds", user?.id], (old) => {
        return old.map((feed) => ({
          ...feed,
          items: feed.items.map((item) =>
            item.id === itemId ? { ...item, is_read: isRead } : item
          ),
        }));
      });

      // Önceki state'i rollback için döndür
      return { previousFeeds };
    },
    onError: (err, variables, context) => {
      // Hata durumunda önceki state'e geri dön
      queryClient.setQueryData(["feeds", user?.id], context.previousFeeds);
      toast.error("Failed to update item status");
    },
    onSettled: () => {
      // İşlem bittiğinde query'yi yenile
      queryClient.invalidateQueries({ queryKey: ["feeds", user?.id] });
    },
  });

  const toggleItemFavoriteMutation = useMutation({
    mutationFn: ({ itemId, isFavorite }) =>
      toggleItemFavorite(itemId, isFavorite),
    onMutate: async ({ itemId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: ["feeds", user?.id] });
      const previousFeeds = queryClient.getQueryData(["feeds", user?.id]);

      queryClient.setQueryData(["feeds", user?.id], (old) => {
        return old.map((feed) => ({
          ...feed,
          items: feed.items.map((item) =>
            item.id === itemId ? { ...item, is_favorite: isFavorite } : item
          ),
        }));
      });

      return { previousFeeds };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["feeds", user?.id], context.previousFeeds);
      toast.error("Failed to update favorite status");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds", user?.id] });
    },
  });

  return {
    feeds,
    isLoading,
    error,
    prefetchFeeds,
    addRssFeed: (data) => addFeedMutation.mutateAsync({ ...data, type: "rss" }),
    addYoutubeFeed: (data) =>
      addFeedMutation.mutateAsync({ ...data, type: "youtube" }),
    deleteFeed: deleteFeedMutation.mutate,
    toggleItemRead: (itemId, isRead) =>
      toggleItemReadMutation.mutate({ itemId, isRead }),
    toggleItemFavorite: (itemId, isFavorite) =>
      toggleItemFavoriteMutation.mutate({ itemId, isFavorite }),
    isAddingRssFeed: addFeedMutation.isPending,
    isAddingYoutubeFeed: addFeedMutation.isPending,
    isDeletingFeed: deleteFeedMutation.isPending,
  };
}
