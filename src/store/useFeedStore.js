import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const CACHE_KEY = "feed-cache";
const CACHE_EXPIRY = 1000 * 60 * 30;

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
  } catch {
    return null;
  }
};

const setCache = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // storage unavailable
  }
};

export const useFeedStore = create(
  persist(
    (set, get) => ({
      feeds: [],
      items: [],

      selectedFeedId: null,
      viewMode: "grid",
      isLoading: false,
      isError: false,
      error: null,

      filters: {
        sortBy: "newest",
        showRead: true,
        showUnread: true,
        feedTypes: {
          rss: true,
          youtube: true,
        },
      },

      setFeeds: (feeds) => set({ feeds }),
      setItems: (items) =>
        set((state) => {
          if (
            !state.items.length ||
            JSON.stringify(items.map((i) => i.id)) !==
              JSON.stringify(state.items.map((i) => i.id))
          ) {
            return { items };
          }
          return { items };
        }),

      setSelectedFeed: (feedId) => set({ selectedFeedId: feedId }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ isError: !!error, error }),

      setFilters: (filters) => set({ filters }),

      updateLocalItem: (itemId, changes) =>
        set((state) => {
          const item = state.items.find((item) => item.id === itemId);
          if (
            !item ||
            Object.entries(changes).every(([key, value]) => item[key] === value)
          ) {
            return state;
          }
          return {
            items: state.items.map((item) =>
              item.id === itemId ? { ...item, ...changes } : item
            ),
          };
        }),

      refreshData: () => set({ isLoading: true, isError: false, error: null }),
      dataLoaded: () => set({ isLoading: false }),

      clearStore: () =>
        set({
          feeds: [],
          items: [],
          selectedFeedId: null,
          isLoading: false,
          isError: false,
          error: null,
        }),
    }),
    {
      name: "feedtune-store",
      partialize: (state) => ({
        viewMode: state.viewMode,
        filters: state.filters,
      }),
    }
  )
);

export const getFilteredItems = () => {
  const { items, feeds, selectedFeedId, filters } = useFeedStore.getState();

  return items
    .filter((item) => {
      if (selectedFeedId && item.feed_id !== selectedFeedId) return false;
      if (!filters.showRead && item.is_read) return false;
      if (!filters.showUnread && !item.is_read) return false;
      const feedType = feeds.find((f) => f.id === item.feed_id)?.type || "rss";
      if (!filters.feedTypes[feedType]) return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === "newest") return new Date(b.published_at) - new Date(a.published_at);
      if (filters.sortBy === "oldest") return new Date(a.published_at) - new Date(b.published_at);
      if (filters.sortBy === "unread") return b.is_read === a.is_read ? 0 : b.is_read ? -1 : 1;
      if (filters.sortBy === "favorites") return b.is_favorite === a.is_favorite ? 0 : b.is_favorite ? 1 : -1;
      return 0;
    });
};
