import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  fetchFeeds,
  fetchFeedItems,
  fetchYoutubeItems,
  limitItemsPerFeed,
} from "@/hooks/features/useFeeds";

// Önbellek ayarları
const CACHE_KEY = "feed-cache";
const CACHE_EXPIRY = 1000 * 60 * 30; // 30 dakika
const MAX_ITEMS_PER_FEED = 50; // Her feed için maksimum item sayısı

// Önbellek yönetimi için yardımcı fonksiyonlar
const getCache = () => {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    if (!cache) return null;

    const { data, timestamp } = JSON.parse(cache);
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Cache error:", error);
    return null;
  }
};

const setCache = (data) => {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error("Cache error:", error);
  }
};

// useFeeds.js'den import edilen limitItemsPerFeed fonksiyonunu kullanıyoruz
// Buradaki tanımı kaldırıyoruz

// Feed ile ilgili toast mesajları için sabit anahtarlar tanımlayalım
const FEED_MESSAGES = {
  LOADING_ERROR: "errors.general",
  FEED_EXISTS: "feeds.feedExists",
  FEED_ADDED: "feeds.feedAdded",
  FEED_ADD_ERROR: "feeds.addFeed.error",
  FEED_REMOVED: "feeds.feedRemovedSuccessfully",
  FEED_REMOVE_ERROR: "errors.failedToDeleteFeed",
  ITEM_STATUS_ERROR: "errors.errorUpdatingItemStatus",
  FAVORITE_STATUS_ERROR: "errors.errorUpdatingFavoriteStatus",
  CACHE_CLEARED: "feeds.cacheCleared",
};

export const useFeedStore = create(
  persist(
    (set, get) => ({
      feeds: [],
      items: [],
      searchQuery: "",
      lastUpdated: null,
      isUpdating: false,
      lastCacheUpdate: null,
      isLoading: false,
      error: null,
      selectedFeedId: null,
      showUnreadOnly: false,
      showFavoritesOnly: false,
      compactMode: false,
      filters: {
        sortBy: "newest",
        showRead: true,
        showUnread: true,
        showFavorites: true,
        feedTypes: {
          rss: true,
          youtube: true,
        },
      },

      // Load user's feeds from cache first, then update in background
      loadFeeds: async (userId) => {
        if (!userId) return;

        const supabase = createClientComponentClient();
        set({ isLoading: true, error: null });

        try {
          // Check cache first
          const cache = getCache();
          if (cache) {
            set({
              feeds: cache.feeds || [],
              items: cache.items || [],
              lastCacheUpdate: new Date(),
              isLoading: false,
            });
          }

          // Fetch fresh data
          // Tüm feed'leri çek
          const feeds = await fetchFeeds(userId);

          // Feed türlerine göre ayır
          const rssFeeds = feeds.filter((feed) => feed.type === "rss");
          const youtubeFeeds = feeds.filter((feed) => feed.type === "youtube");

          // RSS feed item'larını çek
          const rssItems =
            rssFeeds.length > 0
              ? await fetchFeedItems(rssFeeds.map((f) => f.id))
              : [];

          // YouTube feed item'larını çek
          const youtubeItems =
            youtubeFeeds.length > 0
              ? await fetchYoutubeItems(youtubeFeeds.map((f) => f.id))
              : [];

          // Tüm item'ları birleştir
          const allItems = [...rssItems, ...youtubeItems];

          // Veri boyutunu sınırla
          const { feeds: limitedFeeds, items: limitedItems } =
            limitItemsPerFeed(feeds, allItems);

          // Update state and cache
          set({
            feeds: limitedFeeds || [],
            items: limitedItems || [],
            lastUpdated: new Date(),
            isLoading: false,
          });

          // Update cache
          setCache({
            feeds: limitedFeeds || [],
            items: limitedItems || [],
          });
        } catch (error) {
          console.error("Error loading feeds:", error);
          set({
            error: error.message,
            isLoading: false,
          });
          toast.error(FEED_MESSAGES.LOADING_ERROR);
        }
      },

      // Background update function
      updateInBackground: async (userId) => {
        if (!userId) return;

        const supabase = createClientComponentClient();

        try {
          const { feeds } = get();
          const updatedFeeds = [];
          const updatedItems = [];

          // Update each feed
          for (const feed of feeds) {
            try {
              const response = await fetch(
                `/api/proxy?url=${encodeURIComponent(feed.link)}&type=${
                  feed.type
                }`
              );

              if (!response.ok) continue;

              const data = await response.json();
              const items = feed.type === "youtube" ? data.videos : data.items;

              if (items?.length > 0) {
                const feedItems = items
                  .slice(0, MAX_ITEMS_PER_FEED)
                  .map((item) => ({
                    feed_id: feed.id,
                    title: item.title,
                    link: item.link,
                    description: item.description,
                    published_at: item.published_at,
                    thumbnail: item.thumbnail,
                    video_id: feed.type === "youtube" ? item.id : null,
                    is_read: false,
                    is_favorite: false,
                  }));

                // Update database
                await supabase.from("feed_items").upsert(feedItems, {
                  onConflict: "feed_id,link",
                });

                updatedItems.push(...feedItems);
              }

              // Update feed
              const updatedFeed = {
                ...feed,
                last_fetched_at: new Date().toISOString(),
              };
              await supabase
                .from("feeds")
                .update(updatedFeed)
                .eq("id", feed.id);

              updatedFeeds.push(updatedFeed);
            } catch (error) {
              console.error(`Error updating feed ${feed.title}:`, error);
            }
          }

          const limitedData = limitItemsPerFeed(updatedFeeds, updatedItems);

          // Update cache
          setCache({
            feeds: limitedData.feeds,
            items: limitedData.items,
            lastUpdated: new Date().toISOString(),
          });

          set({
            feeds: limitedData.feeds,
            items: limitedData.items,
            lastUpdated: new Date().toISOString(),
          });
        } catch (error) {
          console.error("Error updating feeds:", error);
        }
      },

      // Add a new feed with cache update
      addFeed: async (feed, userId) => {
        try {
          const feeds = get().feeds;
          const existingFeed = feeds.find((f) => f.link === feed.link);

          if (existingFeed) {
            toast.error(FEED_MESSAGES.FEED_EXISTS);
            return;
          }

          const { data: newFeed, error: feedError } = await supabase
            .from("feeds")
            .insert([
              {
                user_id: userId,
                type: feed.type,
                title: feed.title || "Untitled Feed",
                link: feed.link,
                description: feed.description || "",
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

          if (feed.items?.length > 0) {
            // Maksimum item sayısını sınırla
            const itemsToAdd = feed.items.slice(0, MAX_ITEMS_PER_FEED);

            const initialItems = itemsToAdd.map((item) => ({
              feed_id: newFeed.id,
              title: item.title || "",
              link: item.link || "",
              description: item.description || "",
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

            // Update local state and cache
            const now = Date.now();
            const updatedFeeds = [...feeds, newFeed];
            const updatedItems = [...get().items, ...(insertedItems || [])];

            // Veri boyutunu sınırla
            const limitedItems = limitItemsPerFeed(updatedFeeds, updatedItems);

            const cachePayload = {
              feeds: updatedFeeds,
              items: limitedItems.items,
              lastUpdated: now,
            };
            setCache(cachePayload);

            set({
              feeds: updatedFeeds,
              items: limitedItems.items,
              lastCacheUpdate: now,
              lastUpdated: now,
            });
          }

          toast.success(FEED_MESSAGES.FEED_ADDED);
        } catch (error) {
          console.error("Error adding feed:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          toast.error(FEED_MESSAGES.FEED_ADD_ERROR);
          throw error;
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
          const updatedItems = get().items.filter(
            (item) => item.feed_id !== feedId
          );

          // Update cache
          const now = Date.now();
          const cachePayload = {
            feeds: updatedFeeds,
            items: updatedItems,
            lastUpdated: now,
          };
          setCache(cachePayload);

          set({
            feeds: updatedFeeds,
            items: updatedItems,
            lastCacheUpdate: now,
            lastUpdated: now,
          });

          toast.success(FEED_MESSAGES.FEED_REMOVED);
        } catch (error) {
          console.error("Error removing feed:", error);
          toast.error(FEED_MESSAGES.FEED_REMOVE_ERROR);
          throw error;
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

          const updatedItems = get().items.map((item) =>
            item.id === itemId ? { ...item, is_read: isRead } : item
          );

          // Update cache
          const now = Date.now();
          const cachePayload = {
            feeds: get().feeds,
            items: updatedItems,
            lastUpdated: now,
          };
          setCache(cachePayload);

          set({
            items: updatedItems,
            lastCacheUpdate: now,
          });
        } catch (error) {
          console.error("Error updating item read status:", error);
          toast.error(FEED_MESSAGES.ITEM_STATUS_ERROR);
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

          const updatedItems = get().items.map((item) =>
            item.id === itemId ? { ...item, is_favorite: isFavorite } : item
          );

          // Update cache
          const now = Date.now();
          const cachePayload = {
            feeds: get().feeds,
            items: updatedItems,
            lastUpdated: now,
          };
          setCache(cachePayload);

          set({
            items: updatedItems,
            lastCacheUpdate: now,
          });
        } catch (error) {
          console.error("Error updating item favorite status:", error);
          toast.error(FEED_MESSAGES.FAVORITE_STATUS_ERROR);
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
        const { items } = get();
        let itemsFiltered = feedId
          ? items.filter((item) => item.feed_id === feedId)
          : items;

        if (options.onlyUnread) {
          itemsFiltered = itemsFiltered.filter((item) => !item.is_read);
        }
        if (options.onlyFavorites) {
          itemsFiltered = itemsFiltered.filter((item) => item.is_favorite);
        }

        return itemsFiltered.sort(
          (a, b) => new Date(b.published_at) - new Date(a.published_at)
        );
      },

      getFavoriteItems: () => {
        const { items } = get();
        return items
          .filter((item) => item.is_favorite)
          .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
      },

      // Önbelleği temizleme fonksiyonu
      clearCache: () => {
        localStorage.removeItem(CACHE_KEY);
        set({
          feeds: [],
          items: [],
          lastUpdated: null,
        });
        toast.success(FEED_MESSAGES.CACHE_CLEARED);
      },

      setSelectedFeedId: (id) => set({ selectedFeedId: id }),
      setShowUnreadOnly: (value) => set({ showUnreadOnly: value }),
      setShowFavoritesOnly: (value) => set({ showFavoritesOnly: value }),
      setCompactMode: (value) => set({ compactMode: value }),
      setFilters: (filters) => set({ filters }),
      resetFilters: () =>
        set({
          filters: {
            sortBy: "newest",
            showRead: true,
            showUnread: true,
            showFavorites: true,
            feedTypes: {
              rss: true,
              youtube: true,
            },
          },
        }),
    }),
    {
      name: "feed-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lastCacheUpdate: state.lastCacheUpdate,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);
