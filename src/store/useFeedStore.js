import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const useFeedStore = create(
  persist(
    (set, get) => ({
      feeds: [],
      feedItems: [],
      searchQuery: "",
      lastUpdated: null,
      isUpdating: false,

      // Load user's feeds from Supabase
      loadFeeds: async (userId) => {
        try {
          // Önce feed'leri yükle
          const { data: feeds, error: feedError } = await supabase
            .from("feeds")
            .select("*")
            .eq("user_id", userId);

          if (feedError) throw feedError;

          // Son 50 feed item'ı yükle
          const { data: items, error: itemsError } = await supabase
            .from("feed_items")
            .select("*")
            .in(
              "feed_id",
              feeds.map((f) => f.id)
            )
            .order("published_at", { ascending: false })
            .limit(50);

          if (itemsError) throw itemsError;

          set({
            feeds: feeds || [],
            feedItems: items || [],
          });
        } catch (error) {
          console.error("Error loading feeds:", error);
          toast.error("Failed to load feeds");
        }
      },

      // Add a new feed
      addFeed: async (feed, userId) => {
        try {
          const feeds = get().feeds;
          const existingFeed = feeds.find((f) => f.link === feed.link);

          if (existingFeed) {
            toast.error("This feed is already in your list");
            return;
          }

          // Feed'i ekle
          const { data: newFeed, error: feedError } = await supabase
            .from("feeds")
            .insert([
              {
                user_id: userId,
                type: feed.type,
                title: feed.title,
                link: feed.link,
                description: feed.description,
                last_fetched_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (feedError) throw feedError;

          // Feed item'ları ekle
          if (feed.items?.length > 0) {
            const feedItems = feed.items.map((item) => ({
              feed_id: newFeed.id,
              title: item.title,
              link: item.link,
              description: item.description,
              published_at: item.publishedAt || new Date().toISOString(),
              thumbnail: item.thumbnail,
            }));

            const { error: itemsError } = await supabase
              .from("feed_items")
              .insert(feedItems);

            if (itemsError) throw itemsError;
          }

          // Store'u güncelle
          set((state) => ({
            feeds: [...state.feeds, newFeed],
            feedItems: [...state.feedItems, ...feed.items],
          }));

          toast.success("Feed added successfully");
        } catch (error) {
          console.error("Error adding feed:", error);
          toast.error("Failed to add feed");
        }
      },

      // Remove a feed
      removeFeed: async (feedId) => {
        try {
          const { error } = await supabase
            .from("feeds")
            .delete()
            .match({ id: feedId });

          if (error) throw error;

          set((state) => ({
            feeds: state.feeds.filter((feed) => feed.id !== feedId),
            feedItems: state.feedItems.filter(
              (item) => item.feed_id !== feedId
            ),
          }));

          toast.success("Feed removed successfully");
        } catch (error) {
          console.error("Error removing feed:", error);
          toast.error("Failed to remove feed");
        }
      },

      // Update feed items
      updateFeedItems: async (feedId) => {
        try {
          const feed = get().feeds.find((f) => f.id === feedId);
          if (!feed) return false;

          let response;
          if (feed.type === "youtube") {
            const channelId = feed.link.split("/").pop();
            response = await fetch(`/api/proxy/youtube?channelId=${channelId}`);
          } else {
            response = await fetch(
              `/api/proxy?url=${encodeURIComponent(feed.link)}`
            );
          }

          const data = await response.json();
          if (!response.ok)
            throw new Error(data.error || "Failed to update feed");

          // Yeni item'ları formatla
          const newItems = (data.items || []).map((item) => ({
            feed_id: feed.id,
            title: item.title,
            link: item.link,
            description: item.description,
            published_at: item.publishedAt || new Date().toISOString(),
            thumbnail: item.thumbnail,
          }));

          // Mevcut item'ları kontrol et ve sadece yenileri ekle
          const { data: existingItems } = await supabase
            .from("feed_items")
            .select("link")
            .eq("feed_id", feed.id);

          const existingLinks = new Set(existingItems.map((item) => item.link));
          const itemsToAdd = newItems.filter(
            (item) => !existingLinks.has(item.link)
          );

          if (itemsToAdd.length > 0) {
            const { error: insertError } = await supabase
              .from("feed_items")
              .insert(itemsToAdd);

            if (insertError) throw insertError;
          }

          // Feed'in son güncelleme zamanını güncelle
          const { error: updateError } = await supabase
            .from("feeds")
            .update({ last_fetched_at: new Date().toISOString() })
            .eq("id", feed.id);

          if (updateError) throw updateError;

          // Store'u güncelle
          const { data: updatedItems } = await supabase
            .from("feed_items")
            .select("*")
            .eq("feed_id", feed.id)
            .order("published_at", { ascending: false })
            .limit(50);

          set((state) => ({
            feedItems: [
              ...state.feedItems.filter((item) => item.feed_id !== feed.id),
              ...updatedItems,
            ],
          }));

          return true;
        } catch (error) {
          console.error(`Error updating feed items:`, error);
          return false;
        }
      },

      // Mark item as read/unread
      toggleItemRead: async (itemId, isRead) => {
        try {
          const { error } = await supabase
            .from("feed_items")
            .update({ is_read: isRead })
            .eq("id", itemId);

          if (error) throw error;

          set((state) => ({
            feedItems: state.feedItems.map((item) =>
              item.id === itemId ? { ...item, is_read: isRead } : item
            ),
          }));
        } catch (error) {
          console.error("Error updating item read status:", error);
          toast.error("Failed to update item status");
        }
      },

      // Toggle item favorite status
      toggleItemFavorite: async (itemId, isFavorite) => {
        try {
          const { error } = await supabase
            .from("feed_items")
            .update({ is_favorite: isFavorite })
            .eq("id", itemId);

          if (error) throw error;

          set((state) => ({
            feedItems: state.feedItems.map((item) =>
              item.id === itemId ? { ...item, is_favorite: isFavorite } : item
            ),
          }));
        } catch (error) {
          console.error("Error updating item favorite status:", error);
          toast.error("Failed to update favorite status");
        }
      },

      // Update all feeds
      updateAllFeeds: async () => {
        const state = get();
        if (state.isUpdating) return;

        set({ isUpdating: true });
        let updatedCount = 0;
        let failedCount = 0;

        for (const feed of state.feeds) {
          const success = await state.updateFeedItems(feed.id);
          if (success) updatedCount++;
          else failedCount++;
        }

        set({
          isUpdating: false,
          lastUpdated: new Date().toISOString(),
        });

        if (updatedCount > 0) {
          toast.success(`Updated ${updatedCount} feeds successfully`);
        }
        if (failedCount > 0) {
          toast.error(`Failed to update ${failedCount} feeds`);
        }
      },

      // Set search query
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Get filtered feeds
      getFilteredFeeds: () => {
        const { feeds, searchQuery } = get();
        if (!searchQuery) return feeds;

        return feeds.filter((feed) =>
          feed.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      },

      // Get feed items
      getFeedItems: (feedId, options = {}) => {
        const { feedItems } = get();
        let items = feedId
          ? feedItems.filter((item) => item.feed_id === feedId)
          : feedItems;

        // Filtreleme seçenekleri
        if (options.onlyUnread) {
          items = items.filter((item) => !item.is_read);
        }
        if (options.onlyFavorites) {
          items = items.filter((item) => item.is_favorite);
        }

        // Tarihe göre sırala
        return items.sort(
          (a, b) => new Date(b.published_at) - new Date(a.published_at)
        );
      },
    }),
    {
      name: "feed-storage",
      partialize: (state) => ({
        feeds: state.feeds,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);
