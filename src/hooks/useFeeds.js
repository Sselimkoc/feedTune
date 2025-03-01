import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";

// Sabitler
const STALE_TIME = 1000 * 60 * 5; // 5 dakika
const CACHE_TIME = 1000 * 60 * 30; // 30 dakika
const MAX_ITEMS_PER_FEED = 50; // Her feed için maksimum öğe sayısı

// Yardımcı fonksiyonlar
const limitItemsPerFeed = (feeds, items) => {
  if (!feeds || !items) return { feeds: [], items: [] };

  const itemsByFeed = items.reduce((acc, item) => {
    if (!acc[item.feed_id]) {
      acc[item.feed_id] = [];
    }
    acc[item.feed_id].push(item);
    return acc;
  }, {});

  const limitedItems = [];
  Object.entries(itemsByFeed).forEach(([feedId, feedItems]) => {
    limitedItems.push(...feedItems.slice(0, MAX_ITEMS_PER_FEED));
  });

  return { feeds, items: limitedItems };
};

export function useFeeds() {
  const supabase = createClientComponentClient();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Feeds için prefetch fonksiyonu
  const prefetchFeeds = useCallback(async () => {
    try {
      if (!user) return;

      // Feeds için sorgu
      await queryClient.prefetchQuery({
        queryKey: ["feeds", user.id],
        queryFn: async () => {
          const { data: feeds, error: feedError } = await supabase
            .from("feeds")
            .select("*")
            .eq("user_id", user.id);

          if (feedError) throw feedError;

          const { data: items, error: itemsError } = await supabase
            .from("feed_items")
            .select("*")
            .in(
              "feed_id",
              feeds.map((f) => f.id)
            )
            .order("published_at", { ascending: false });

          if (itemsError) throw itemsError;

          // Veri boyutunu sınırla
          const limitedItems = limitItemsPerFeed(feeds, items);

          return {
            feeds: limitedItems.feeds || [],
            items: limitedItems.items || [],
          };
        },
        staleTime: STALE_TIME,
        cacheTime: CACHE_TIME,
      });
    } catch (error) {
      console.error("Error prefetching feeds:", error);
    }
  }, [supabase, queryClient, user]);

  // Ana feed sorgusu
  const feedsQuery = useQuery({
    queryKey: ["feeds", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { data: feeds, error: feedsError } = await supabase
        .from("feeds")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (feedsError) throw feedsError;

      const { data: items, error: itemsError } = await supabase
        .from("feed_items")
        .select("*")
        .in(
          "feed_id",
          feeds.map((f) => f.id)
        )
        .order("published_at", { ascending: false });

      if (itemsError) throw itemsError;

      return limitItemsPerFeed(feeds, items);
    },
    enabled: !!user?.id,
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
  });

  // RSS feed ekleme
  const addRssFeed = async ({ url, userId }) => {
    if (!url || !userId) {
      throw new Error("URL and user ID are required");
    }

    try {
      // Önce feed'in zaten var olup olmadığını kontrol et
      const { data: existingFeeds } = await supabase
        .from("feeds")
        .select("*")
        .eq("user_id", userId)
        .eq("link", url)
        .eq("type", "rss");

      if (existingFeeds && existingFeeds.length > 0) {
        throw new Error("This feed is already in your list");
      }

      // RSS feed'i ayrıştır
      const response = await fetch(
        `/api/proxy?url=${encodeURIComponent(url)}&type=rss`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to parse RSS feed");
      }

      const { feed, items } = await response.json();

      // Feed'i veritabanına ekle
      const { data: newFeed, error: feedError } = await supabase
        .from("feeds")
        .insert([
          {
            user_id: userId,
            type: "rss",
            title: feed.title || "Untitled Feed",
            link: url,
            description: feed.description || "",
            last_fetched_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (feedError) throw feedError;

      // Feed öğelerini sınırla ve veritabanına ekle
      if (items && items.length > 0) {
        const feedItems = items.slice(0, MAX_ITEMS_PER_FEED).map((item) => ({
          feed_id: newFeed.id,
          title: item.title || "",
          link: item.link || "",
          description: item.description || "",
          published_at: item.published_at || new Date().toISOString(),
          thumbnail: item.thumbnail,
          is_read: false,
          is_favorite: false,
        }));

        const { error: itemsError } = await supabase
          .from("feed_items")
          .insert(feedItems);

        if (itemsError) {
          console.error("Error adding feed items:", itemsError);
          // Don't throw here, as the feed was already added
        }
      }

      // Sorguyu geçersiz kıl ve yeniden getir
      await queryClient.invalidateQueries({ queryKey: ["feeds"] });

      return newFeed;
    } catch (error) {
      console.error("Error adding RSS feed:", error);
      throw error;
    }
  };

  // YouTube feed ekleme
  const addYoutubeFeed = async ({ channelId, userId }) => {
    if (!channelId || !userId) {
      throw new Error("Channel ID and user ID are required");
    }

    try {
      // Önce feed'in zaten var olup olmadığını kontrol et
      const channelUrl = `https://www.youtube.com/channel/${channelId}`;

      const { data: existingFeeds } = await supabase
        .from("feeds")
        .select("*")
        .eq("user_id", userId)
        .eq("type", "youtube")
        .eq("link", channelUrl);

      if (existingFeeds && existingFeeds.length > 0) {
        throw new Error("This YouTube channel is already in your list");
      }

      // YouTube API'den kanal ve video bilgilerini al
      const response = await fetch(
        `/api/youtube?channelId=${encodeURIComponent(channelId)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch YouTube channel");
      }

      const data = await response.json();

      // Feed'i veritabanına ekle
      const { data: newFeed, error: feedError } = await supabase
        .from("feeds")
        .insert([
          {
            user_id: userId,
            type: "youtube",
            title: data.channel.title,
            link: channelUrl,
            description: data.channel.description,
            last_fetched_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (feedError) throw feedError;

      // Feed öğelerini sınırla ve veritabanına ekle
      if (data.videos && data.videos.length > 0) {
        const feedItems = data.videos
          .slice(0, MAX_ITEMS_PER_FEED)
          .map((video) => ({
            feed_id: newFeed.id,
            title: video.title,
            link: video.link,
            description: video.description,
            published_at: video.publishedAt,
            thumbnail: video.thumbnail,
            video_id: video.id,
            is_read: false,
            is_favorite: false,
          }));

        const { error: itemsError } = await supabase
          .from("feed_items")
          .insert(feedItems);

        if (itemsError) {
          console.error("Error adding feed items:", itemsError);
          // Feed'i sil
          await supabase.from("feeds").delete().eq("id", newFeed.id);
          throw new Error("Failed to add feed items");
        }
      }

      // YouTube kanalı detaylarını kaydet
      const { error: youtubeError } = await supabase
        .from("youtube_feeds")
        .insert([
          {
            id: newFeed.id,
            channel_id: channelId,
            channel_avatar: data.channel.thumbnail,
            subscriber_count: data.channel.statistics.subscriberCount,
            video_count: data.channel.statistics.videoCount,
            playlist_id: data.channel.uploadsPlaylistId,
          },
        ]);

      if (youtubeError) {
        console.error("Error adding YouTube feed details:", youtubeError);
        // Feed'i ve feed öğelerini sil
        await supabase.from("feeds").delete().eq("id", newFeed.id);
        throw new Error("Failed to add YouTube feed details");
      }

      // Sorguyu geçersiz kıl ve yeniden getir
      await queryClient.invalidateQueries({ queryKey: ["feeds"] });

      return newFeed;
    } catch (error) {
      console.error("Error adding YouTube feed:", error);
      throw error;
    }
  };

  // Feed silme
  const deleteFeed = useMutation({
    mutationFn: async (feedId) => {
      const { error } = await supabase
        .from("feeds")
        .delete()
        .match({ id: feedId });

      if (error) throw error;
      return feedId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      toast.success("Feed removed successfully");
    },
    onError: (error) => {
      console.error("Error deleting feed:", error);

      if (error.code === "PGRST116") {
        toast.error("You need to be logged in to delete feeds");
      } else if (error.code === "23503") {
        toast.error("Feed not found or already deleted");
      } else {
        toast.error(
          `Failed to delete feed: ${error.message || "Unknown error"}`
        );
      }
    },
  });

  // Öğe okundu durumunu değiştirme
  const toggleItemReadMutation = useMutation({
    mutationFn: async ({ itemId, isRead }) => {
      const { error } = await supabase
        .from("feed_items")
        .update({ is_read: isRead })
        .eq("id", itemId);

      if (error) throw error;
      return { itemId, isRead };
    },
    onMutate: async ({ itemId, isRead }) => {
      // Önceki sorguları iptal et
      await queryClient.cancelQueries({ queryKey: ["feeds"] });

      // Önceki verileri kaydet
      const previousData = queryClient.getQueryData(["feeds"]);

      // Verileri iyimser bir şekilde güncelle
      queryClient.setQueryData(["feeds"], (old) => {
        if (!old) return { feeds: [], items: [] };

        return {
          ...old,
          items: old.items.map((item) =>
            item.id === itemId ? { ...item, is_read: isRead } : item
          ),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Hata durumunda önceki verileri geri yükle
      if (context?.previousData) {
        queryClient.setQueryData(["feeds"], context.previousData);
      }
      toast.error("Failed to update item status");
    },
    onSettled: () => {
      // Sorguyu geçersiz kıl ve yeniden getir
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });

  // Öğe favori durumunu değiştirme
  const toggleItemFavoriteMutation = useMutation({
    mutationFn: async ({ itemId, isFavorite }) => {
      const { error } = await supabase
        .from("feed_items")
        .update({ is_favorite: isFavorite })
        .eq("id", itemId);

      if (error) throw error;
      return { itemId, isFavorite };
    },
    onMutate: async ({ itemId, isFavorite }) => {
      // Önceki sorguları iptal et
      await queryClient.cancelQueries({ queryKey: ["feeds"] });

      // Önceki verileri kaydet
      const previousData = queryClient.getQueryData(["feeds"]);

      // Verileri iyimser bir şekilde güncelle
      queryClient.setQueryData(["feeds"], (old) => {
        if (!old) return { feeds: [], items: [] };

        return {
          ...old,
          items: old.items.map((item) =>
            item.id === itemId ? { ...item, is_favorite: isFavorite } : item
          ),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Hata durumunda önceki verileri geri yükle
      if (context?.previousData) {
        queryClient.setQueryData(["feeds"], context.previousData);
      }
      toast.error("Failed to update favorite status");
    },
    onSettled: () => {
      // Sorguyu geçersiz kıl ve yeniden getir
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });

  return {
    feeds: feedsQuery.data?.feeds || [],
    items: feedsQuery.data?.items || [],
    isLoading: feedsQuery.isLoading,
    isError: feedsQuery.isError,
    error: feedsQuery.error,
    refetch: feedsQuery.refetch,
    prefetchFeeds,
    addRssFeed,
    addYoutubeFeed,
    deleteFeed: deleteFeed.mutate,
    isDeleting: deleteFeed.isLoading,
    toggleItemRead: toggleItemReadMutation.mutate,
    isTogglingRead: toggleItemReadMutation.isLoading,
    toggleItemFavorite: toggleItemFavoriteMutation.mutate,
    isTogglingFavorite: toggleItemFavoriteMutation.isLoading,
  };
}
