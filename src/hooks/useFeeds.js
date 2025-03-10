import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { useCallback, useState, useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguage } from "@/contexts/LanguageContext";

// Sabitler
const STALE_TIME = 1000 * 60 * 5; // 5 dakika
const CACHE_TIME = 1000 * 60 * 30; // 30 dakika
const ITEMS_PER_FEED = 10; // Her feed için maksimum öğe sayısı

// Yardımcı fonksiyonlar
export const limitItemsPerFeed = (feeds, items) => {
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
    limitedItems.push(...feedItems.slice(0, ITEMS_PER_FEED));
  });

  return { feeds, items: limitedItems };
};

// Supabase client'ı oluştur
const createSupabaseClient = () => createClientComponentClient();

// Veri çekme fonksiyonları
export const fetchFeeds = async (userId) => {
  const supabase = createSupabaseClient();
  // Tüm feed türlerini tek bir sorguda çek
  const { data, error } = await supabase
    .from("feeds")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

export const fetchFeedItems = async (feedIds) => {
  if (!feedIds || feedIds.length === 0) return [];

  const supabase = createSupabaseClient();

  // Her feed için ayrı ayrı sorgu yap ve her birinden sadece 10 öğe al
  const promises = feedIds.map(async (feedId) => {
    const { data, error } = await supabase
      .from("feed_items")
      .select("*")
      .eq("feed_id", feedId)
      .order("published_at", { ascending: false })
      .limit(ITEMS_PER_FEED);

    if (error) throw new Error(error.message);
    return data;
  });

  // Tüm sorguların sonuçlarını bekle ve birleştir
  const results = await Promise.all(promises);
  return results.flat();
};

export const fetchUserInteractions = async (userId, itemIds) => {
  if (!userId || !itemIds || itemIds.length === 0) return [];

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("user_item_interactions")
    .select("*")
    .eq("user_id", userId)
    .in("item_id", itemIds);

  if (error) throw new Error(error.message);
  return data;
};

export const fetchFavorites = async (userId) => {
  if (!userId) return [];

  const supabase = createSupabaseClient();

  try {
    // Önce kullanıcının favori etkileşimlerini al
    const { data: interactions, error: interactionsError } = await supabase
      .from("user_item_interactions")
      .select("item_id")
      .eq("user_id", userId)
      .eq("is_favorite", true);

    if (interactionsError) throw interactionsError;

    if (!interactions || interactions.length === 0) {
      return [];
    }

    // Ardından bu öğelerin detaylarını al
    const itemIds = interactions.map((interaction) => interaction.item_id);
    const { data: items, error: itemsError } = await supabase
      .from("feed_items")
      .select(
        `
        *,
        feeds:feed_id (
          id,
          title,
          site_favicon,
          type
        )
      `
      )
      .in("id", itemIds)
      .order("published_at", { ascending: false });

    if (itemsError) throw itemsError;

    // Etkileşim bilgilerini öğelere ekle
    const itemsWithInteractions = items.map((item) => ({
      ...item,
      is_favorite: true, // Zaten favorilerde olduğunu biliyoruz
      feed_title: item.feeds?.title || "Bilinmeyen Kaynak",
      feed_type: item.feeds?.type || "rss",
      site_favicon: item.feeds?.site_favicon || null,
    }));

    return itemsWithInteractions;
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
};

export const fetchReadLaterItems = async (userId) => {
  if (!userId) return [];

  const supabase = createSupabaseClient();

  try {
    // Önce kullanıcının okuma listesi etkileşimlerini al
    const { data: interactions, error: interactionsError } = await supabase
      .from("user_item_interactions")
      .select("item_id")
      .eq("user_id", userId)
      .eq("is_read_later", true);

    if (interactionsError) throw interactionsError;

    if (!interactions || interactions.length === 0) {
      return [];
    }

    // Ardından bu öğelerin detaylarını al
    const itemIds = interactions.map((interaction) => interaction.item_id);
    const { data: items, error: itemsError } = await supabase
      .from("feed_items")
      .select(
        `
        *,
        feeds:feed_id (
          id,
          title,
          site_favicon,
          type
        )
      `
      )
      .in("id", itemIds)
      .order("published_at", { ascending: false });

    if (itemsError) throw itemsError;

    // Etkileşim bilgilerini öğelere ekle
    const itemsWithInteractions = items.map((item) => ({
      ...item,
      is_read_later: true, // Zaten okuma listesinde olduğunu biliyoruz
      feed_title: item.feeds?.title || "Bilinmeyen Kaynak",
      feed_type: item.feeds?.type || "rss",
      site_favicon: item.feeds?.site_favicon || null,
    }));

    return itemsWithInteractions;
  } catch (error) {
    console.error("Error fetching read later items:", error);
    return [];
  }
};

// YouTube öğeleri de feed_items tablosunda saklandığı için aynı fonksiyonu kullanabiliriz
export const fetchYoutubeItems = fetchFeedItems;

// Ana hook
export function useFeeds() {
  const supabase = createSupabaseClient();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { t } = useLanguage();

  // Ana feed sorgusu
  const feedsQuery = useQuery({
    queryKey: ["feeds", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      // Tüm feed'leri çek
      const feeds = await fetchFeeds(user.id);

      // Tüm feed'lerin öğelerini çek
      const allFeedIds = feeds.map((f) => f.id);
      const allItems = await fetchFeedItems(allFeedIds);

      // Kullanıcı etkileşimlerini çek
      const allItemIds = allItems.map((item) => item.id);
      const interactions = await fetchUserInteractions(user.id, allItemIds);

      // Etkileşimleri öğelerle birleştir
      const itemsWithInteractions = allItems.map((item) => {
        const interaction = interactions.find((i) => i.item_id === item.id);
        return {
          ...item,
          is_read: interaction?.is_read || false,
          is_favorite: interaction?.is_favorite || false,
          is_read_later: interaction?.is_read_later || false,
          read_position: interaction?.read_position || 0,
          notes: interaction?.notes || "",
          rating: interaction?.rating || 0,
        };
      });

      // Yayınlanma tarihine göre sırala
      itemsWithInteractions.sort(
        (a, b) =>
          new Date(b.published_at).getTime() -
          new Date(a.published_at).getTime()
      );

      return { feeds, items: itemsWithInteractions };
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
            site_favicon: feed.favicon || "",
            last_fetched_at: new Date().toISOString(),
            is_active: true,
            refresh_frequency: 60, // Varsayılan 60 dakika
          },
        ])
        .select()
        .single();

      if (feedError) throw feedError;

      // RSS feed detaylarını ekle
      const { error: rssError } = await supabase.from("rss_feeds").insert([
        {
          id: newFeed.id,
          feed_url: url,
          last_build_date: feed.lastBuildDate || null,
          language: feed.language || null,
          categories: feed.categories || [],
        },
      ]);

      if (rssError) {
        // Hata durumunda feed'i sil
        await supabase.from("feeds").delete().eq("id", newFeed.id);
        throw rssError;
      }

      // Feed öğelerini sınırla ve veritabanına ekle
      if (items && items.length > 0) {
        const feedItems = items.slice(0, ITEMS_PER_FEED).map((item) => ({
          feed_id: newFeed.id,
          title: item.title || "",
          link: item.link || "",
          description: item.description || "",
          content: item.content || "",
          author: item.author || "",
          published_at: item.published_at || new Date().toISOString(),
          updated_at: item.updated_at || null,
          thumbnail: item.thumbnail || null,
          media_url: item.media_url || null,
          guid: item.guid || item.link,
        }));

        const { data: insertedItems, error: itemsError } = await supabase
          .from("feed_items")
          .insert(feedItems)
          .select();

        if (itemsError) {
          console.error("Error adding feed items:", itemsError);
          // Feed'i sil
          await supabase.from("feeds").delete().eq("id", newFeed.id);
          throw new Error("Failed to add feed items");
        }

        // Kullanıcı etkileşimlerini oluştur
        if (insertedItems && insertedItems.length > 0) {
          const interactions = insertedItems.map((item) => ({
            user_id: userId,
            item_id: item.id,
            is_read: false,
            is_favorite: false,
            is_read_later: false,
          }));

          const { error: interactionsError } = await supabase
            .from("user_item_interactions")
            .insert(interactions);

          if (interactionsError) {
            console.error("Error adding user interactions:", interactionsError);
            // Hata durumunda feed'i ve öğeleri sil
            await supabase.from("feeds").delete().eq("id", newFeed.id);
            throw new Error("Failed to add user interactions");
          }
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
            site_favicon: data.channel.thumbnail,
            last_fetched_at: new Date().toISOString(),
            is_active: true,
            refresh_frequency: 60, // Varsayılan 60 dakika
          },
        ])
        .select()
        .single();

      if (feedError) throw feedError;

      // YouTube feed detaylarını ekle
      const { error: youtubeError } = await supabase
        .from("youtube_feeds")
        .insert([
          {
            id: newFeed.id,
            channel_id: channelId,
            channel_title: data.channel.title,
            channel_thumbnail: data.channel.thumbnail,
            subscriber_count: data.channel.statistics.subscriberCount,
            video_count: data.channel.statistics.videoCount,
            playlist_id: data.channel.uploadsPlaylistId,
          },
        ]);

      if (youtubeError) {
        // Hata durumunda feed'i sil
        await supabase.from("feeds").delete().eq("id", newFeed.id);
        throw youtubeError;
      }

      // Feed öğelerini sınırla ve veritabanına ekle
      if (data.videos && data.videos.length > 0) {
        const feedItems = data.videos.slice(0, ITEMS_PER_FEED).map((video) => ({
          feed_id: newFeed.id,
          title: video.title,
          link: video.link,
          description: video.description,
          content: video.description,
          author: data.channel.title,
          published_at: video.publishedAt,
          updated_at: null,
          thumbnail: video.thumbnail,
          media_url: `https://www.youtube.com/embed/${video.id}`,
          guid: video.id,
        }));

        const { data: insertedItems, error: itemsError } = await supabase
          .from("feed_items")
          .insert(feedItems)
          .select();

        if (itemsError) {
          console.error("Error adding feed items:", itemsError);
          // Feed'i sil
          await supabase.from("feeds").delete().eq("id", newFeed.id);
          throw new Error("Failed to add feed items");
        }

        // YouTube öğe detaylarını ekle
        if (insertedItems && insertedItems.length > 0) {
          const youtubeDetails = insertedItems.map((item, index) => {
            const video = data.videos[index];
            return {
              item_id: item.id,
              video_id: video.id,
              duration: video.duration || null,
              view_count: video.viewCount || 0,
              like_count: video.likeCount || 0,
              comment_count: video.commentCount || 0,
            };
          });

          const { error: detailsError } = await supabase
            .from("youtube_item_details")
            .insert(youtubeDetails);

          if (detailsError) {
            console.error("Error adding YouTube details:", detailsError);
            // Hata durumunda feed'i ve öğeleri sil
            await supabase.from("feeds").delete().eq("id", newFeed.id);
            throw new Error("Failed to add YouTube details");
          }

          // Kullanıcı etkileşimlerini oluştur
          const interactions = insertedItems.map((item) => ({
            user_id: userId,
            item_id: item.id,
            is_read: false,
            is_favorite: false,
            is_read_later: false,
          }));

          const { error: interactionsError } = await supabase
            .from("user_item_interactions")
            .insert(interactions);

          if (interactionsError) {
            console.error("Error adding user interactions:", interactionsError);
            // Hata durumunda feed'i ve öğeleri sil
            await supabase.from("feeds").delete().eq("id", newFeed.id);
            throw new Error("Failed to add user interactions");
          }
        }
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
      toast.success(t("feedRemovedSuccessfully"));
    },
    onError: (error) => {
      console.error("Error deleting feed:", error);

      if (error.code === "PGRST116") {
        toast.error(t("needToBeLoggedInToDeleteFeeds"));
      } else if (error.code === "23503") {
        toast.error(t("feedNotFoundOrAlreadyDeleted"));
      } else {
        toast.error(
          `${t("failedToDeleteFeed")}: ${error.message || "Unknown error"}`
        );
      }
    },
  });

  // Öğe okundu durumunu değiştirme
  const toggleItemRead = async (itemId, isRead) => {
    console.log("Toggling read status in useFeeds:", itemId, isRead);

    if (!user.id) {
      toast.error(t("errors.needToBeLoggedIn"));
      return;
    }

    try {
      // Optimistic update
      queryClient.setQueryData(["userInteractions", user.id], (old) => {
        if (!old) return {};
        return {
          ...old,
          [itemId]: { ...old[itemId], is_read: isRead },
        };
      });

      // Update in database
      const { error } = await supabase.from("user_item_interactions").upsert(
        {
          user_id: user.id,
          item_id: itemId,
          is_read: isRead,
        },
        { onConflict: "user_id,item_id" }
      );

      if (error) throw error;

      // Invalidate queries
      queryClient.invalidateQueries(["userInteractions", user.id]);

      // Başarılı işlem sonrası kullanıcıya bildirim göster
      toast.success(
        isRead ? t("feeds.itemMarkedAsRead") : t("feeds.itemMarkedAsUnread"),
        {
          duration: 2000,
          position: "bottom-right",
        }
      );
    } catch (error) {
      console.error("Error toggling read status:", error);

      // Rollback on error
      queryClient.setQueryData(["userInteractions", user.id], (old) => {
        if (!old) return {};
        return {
          ...old,
          [itemId]: { ...old[itemId], is_read: !isRead },
        };
      });

      toast.error(t("errors.errorUpdatingItemStatus"));
    }
  };

  // Öğe favori durumunu değiştirme
  const toggleItemFavorite = async (itemId, isFavorite) => {
    console.log("Toggling favorite status in useFeeds:", itemId, isFavorite);

    if (!user.id) {
      toast.error(t("errors.needToBeLoggedIn"));
      return;
    }

    try {
      // Optimistic update
      queryClient.setQueryData(["userInteractions", user.id], (old) => {
        if (!old) return {};
        return {
          ...old,
          [itemId]: { ...old[itemId], is_favorite: isFavorite },
        };
      });

      // Update in database
      const { error } = await supabase.from("user_item_interactions").upsert(
        {
          user_id: user.id,
          item_id: itemId,
          is_favorite: isFavorite,
        },
        { onConflict: "user_id,item_id" }
      );

      if (error) throw error;

      // Invalidate queries
      queryClient.invalidateQueries(["userInteractions", user.id]);
      queryClient.invalidateQueries(["favorites", user.id]);

      // Başarılı işlem sonrası kullanıcıya bildirim göster
      toast.success(
        isFavorite
          ? t("feeds.itemAddedToFavorites")
          : t("feeds.itemRemovedFromFavorites"),
        {
          duration: 2000,
          position: "bottom-right",
        }
      );
    } catch (error) {
      console.error("Error toggling favorite status:", error);

      // Rollback on error
      queryClient.setQueryData(["userInteractions", user.id], (old) => {
        if (!old) return {};
        return {
          ...old,
          [itemId]: { ...old[itemId], is_favorite: !isFavorite },
        };
      });

      toast.error(t("errors.errorUpdatingFavoriteStatus"));
    }
  };

  // Öğe okuma listesi durumunu değiştirme
  const toggleItemReadLater = async (itemId, isReadLater) => {
    console.log("Toggling read later status in useFeeds:", itemId, isReadLater);

    if (!user.id) {
      toast.error(t("errors.needToBeLoggedIn"));
      return;
    }

    try {
      // Optimistic update
      queryClient.setQueryData(["userInteractions", user.id], (old) => {
        if (!old) return {};
        return {
          ...old,
          [itemId]: { ...old[itemId], is_read_later: isReadLater },
        };
      });

      // Update in database
      const { error } = await supabase.from("user_item_interactions").upsert(
        {
          user_id: user.id,
          item_id: itemId,
          is_read_later: isReadLater,
        },
        { onConflict: "user_id,item_id" }
      );

      if (error) throw error;

      // Invalidate queries
      queryClient.invalidateQueries(["userInteractions", user.id]);
      queryClient.invalidateQueries(["readLater", user.id]);

      // Başarılı işlem sonrası kullanıcıya bildirim göster
      toast.success(
        isReadLater
          ? t("feeds.itemAddedToReadLater")
          : t("feeds.itemRemovedFromReadLater"),
        {
          duration: 2000,
          position: "bottom-right",
        }
      );
    } catch (error) {
      console.error("Error toggling read later status:", error);

      // Rollback on error
      queryClient.setQueryData(["userInteractions", user.id], (old) => {
        if (!old) return {};
        return {
          ...old,
          [itemId]: { ...old[itemId], is_read_later: !isReadLater },
        };
      });

      toast.error(t("errors.errorUpdatingReadLaterStatus"));
    }
  };

  return {
    feeds: feedsQuery.data?.feeds || [],
    items: feedsQuery.data?.items || [],
    isLoading: feedsQuery.isLoading,
    isError: feedsQuery.isError,
    error: feedsQuery.error,
    refetch: feedsQuery.refetch,
    addRssFeed,
    addYoutubeFeed,
    deleteFeed: deleteFeed.mutate,
    isDeleting: deleteFeed.isLoading,
    toggleItemRead,
    toggleItemFavorite,
    toggleItemReadLater,
  };
}
