import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const CACHE_KEY = "feed-cache";
const CACHE_EXPIRY = 1000 * 60 * 30; // 30 dakika

export const useFeedStore = create(
  persist(
    (set, get) => ({
      feeds: [],
      feedItems: [],
      searchQuery: "",
      lastUpdated: null,
      isUpdating: false,
      lastCacheUpdate: null,

      // Load user's feeds from cache first, then update in background
      loadFeeds: async (userId) => {
        try {
          // Cache kontrolü
          const cache = localStorage.getItem(CACHE_KEY);
          const cacheData = cache ? JSON.parse(cache) : null;
          const now = Date.now();

          // Cache varsa ve güncel ise kullan
          if (cacheData && now - cacheData.timestamp < CACHE_EXPIRY) {
            set({
              feeds: cacheData.feeds,
              feedItems: cacheData.feedItems,
              lastCacheUpdate: cacheData.timestamp,
              lastUpdated: cacheData.timestamp,
            });

            // Arka planda güncelleme yap
            get().updateInBackground(userId);
            return;
          }

          // Cache yok veya güncel değilse database'den yükle
          const { data: feeds, error: feedError } = await supabase
            .from("feeds")
            .select("*")
            .eq("user_id", userId);

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

          // Cache'i güncelle
          const cachePayload = {
            feeds: feeds || [],
            feedItems: items || [],
            timestamp: now,
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));

          set({
            feeds: feeds || [],
            feedItems: items || [],
            lastCacheUpdate: now,
            lastUpdated: now,
          });
        } catch (error) {
          console.error("Error loading feeds:", error);
          toast.error("Failed to load feeds");
        }
      },

      // Background update function
      updateInBackground: async (userId) => {
        try {
          set({ isUpdating: true });

          const { data: feeds, error: feedError } = await supabase
            .from("feeds")
            .select("*")
            .eq("user_id", userId);

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

          const now = Date.now();

          // Cache'i güncelle
          const cachePayload = {
            feeds: feeds || [],
            feedItems: items || [],
            timestamp: now,
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));

          set({
            feeds: feeds || [],
            feedItems: items || [],
            lastCacheUpdate: now,
            lastUpdated: now,
            isUpdating: false,
          });

          // Yeni içerik varsa bildirim göster
          const currentItems = get().feedItems;
          const newItems = items.filter(
            (newItem) =>
              !currentItems.some((currentItem) => currentItem.id === newItem.id)
          );

          if (newItems.length > 0) {
            toast.success(`${newItems.length} yeni içerik bulundu`);
          }
        } catch (error) {
          console.error("Background update error:", error);
          set({ isUpdating: false });
        }
      },

      // Add a new feed with cache update
      addFeed: async (feed, userId) => {
        try {
          const feeds = get().feeds;
          const existingFeed = feeds.find((f) => f.link === feed.link);

          if (existingFeed) {
            toast.error("This feed is already in your list");
            return;
          }

          console.log("Adding feed:", {
            type: feed.type,
            title: feed.title,
            link: feed.link,
            description: feed.description,
            channel_avatar: feed.channel_avatar,
          });

          const { data: newFeed, error: feedError } = await supabase
            .from("feeds")
            .insert([
              {
                user_id: userId,
                type: feed.type,
                title: feed.title,
                link: feed.link,
                description: feed.description,
                channel_avatar: feed.channel_avatar,
                last_fetched_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (feedError) {
            console.error("Feed insert error:", feedError);
            throw feedError;
          }

          if (!newFeed) {
            throw new Error("No feed data returned after insert");
          }

          console.log("Feed added successfully:", newFeed);

          if (feed.items?.length > 0) {
            console.log(
              `Adding ${feed.items.length} items for feed:`,
              newFeed.id
            );

            const initialItems = feed.items.map((item) => ({
              feed_id: newFeed.id,
              title: item.title,
              link: item.link,
              description: item.description,
              published_at: item.published_at || new Date().toISOString(),
              thumbnail: item.thumbnail,
              is_read: false,
              is_favorite: false,
            }));

            const { data: insertedItems, error: itemsError } = await supabase
              .from("feed_items")
              .insert(initialItems)
              .select();

            if (itemsError) {
              console.error("Items insert error:", itemsError);
              throw itemsError;
            }

            console.log(
              `${insertedItems?.length || 0} items added successfully`
            );

            // Update local state and cache
            const now = Date.now();
            const updatedFeeds = [...feeds, newFeed];
            const updatedItems = [...get().feedItems, ...insertedItems];

            const cachePayload = {
              feeds: updatedFeeds,
              feedItems: updatedItems,
              timestamp: now,
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));

            set({
              feeds: updatedFeeds,
              feedItems: updatedItems,
              lastCacheUpdate: now,
              lastUpdated: now,
            });
          }

          toast.success(`Added feed: ${feed.title}`);
        } catch (error) {
          console.error("Error adding feed:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          toast.error(
            `Failed to add feed: ${error.message || "Unknown error"}`
          );
          throw error; // Yeniden fırlat ki üst katmanda da hata yönetilebilsin
        }
      },

      // Remove feed with cache update
      removeFeed: async (feedId) => {
        try {
          const { error } = await supabase
            .from("feeds")
            .delete()
            .match({ id: feedId });

          if (error) throw error;

          const updatedFeeds = get().feeds.filter((feed) => feed.id !== feedId);
          const updatedItems = get().feedItems.filter(
            (item) => item.feed_id !== feedId
          );

          // Update cache
          const now = Date.now();
          const cachePayload = {
            feeds: updatedFeeds,
            feedItems: updatedItems,
            timestamp: now,
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));

          set({
            feeds: updatedFeeds,
            feedItems: updatedItems,
            lastCacheUpdate: now,
            lastUpdated: now,
          });

          toast.success("Feed removed successfully");
        } catch (error) {
          console.error("Error removing feed:", error);
          toast.error("Failed to remove feed");
        }
      },

      // Toggle item read status with cache update
      toggleItemRead: async (itemId, isRead) => {
        try {
          const { error } = await supabase
            .from("feed_items")
            .update({ is_read: isRead })
            .eq("id", itemId);

          if (error) throw error;

          const updatedItems = get().feedItems.map((item) =>
            item.id === itemId ? { ...item, is_read: isRead } : item
          );

          // Update cache
          const now = Date.now();
          const cachePayload = {
            feeds: get().feeds,
            feedItems: updatedItems,
            timestamp: now,
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));

          set({
            feedItems: updatedItems,
            lastCacheUpdate: now,
          });
        } catch (error) {
          console.error("Error updating item read status:", error);
          toast.error("Failed to update item status");
        }
      },

      // Toggle item favorite status with cache update
      toggleItemFavorite: async (itemId, isFavorite) => {
        try {
          const { error } = await supabase
            .from("feed_items")
            .update({ is_favorite: isFavorite })
            .eq("id", itemId);

          if (error) throw error;

          const updatedItems = get().feedItems.map((item) =>
            item.id === itemId ? { ...item, is_favorite: isFavorite } : item
          );

          // Update cache
          const now = Date.now();
          const cachePayload = {
            feeds: get().feeds,
            feedItems: updatedItems,
            timestamp: now,
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));

          set({
            feedItems: updatedItems,
            lastCacheUpdate: now,
          });
        } catch (error) {
          console.error("Error updating item favorite status:", error);
          toast.error("Failed to update favorite status");
        }
      },

      // Utility functions
      setSearchQuery: (query) => set({ searchQuery: query }),

      getFilteredFeeds: () => {
        const { feeds, searchQuery } = get();
        if (!searchQuery) return feeds;

        return feeds.filter((feed) =>
          feed.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      },

      getFeedItems: (feedId, options = {}) => {
        const { feedItems } = get();
        let items = feedId
          ? feedItems.filter((item) => item.feed_id === feedId)
          : feedItems;

        if (options.onlyUnread) {
          items = items.filter((item) => !item.is_read);
        }
        if (options.onlyFavorites) {
          items = items.filter((item) => item.is_favorite);
        }

        return items.sort(
          (a, b) => new Date(b.published_at) - new Date(a.published_at)
        );
      },

      getFavoriteItems: () => {
        const { feedItems } = get();
        return feedItems
          .filter((item) => item.is_favorite)
          .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
      },
    }),
    {
      name: "feed-storage",
      partialize: (state) => ({
        lastCacheUpdate: state.lastCacheUpdate,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);
