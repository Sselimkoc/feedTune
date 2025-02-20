import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useFeedStore = create(
  persist(
    (set, get) => ({
      feeds: [],
      searchQuery: "",

      // Add a new feed
      addFeed: (feed) =>
        set((state) => ({
          feeds: [feed, ...state.feeds.filter((f) => f.link !== feed.link)],
        })),

      // Remove a feed
      removeFeed: (link) =>
        set((state) => ({
          feeds: state.feeds.filter((f) => f.link !== link),
        })),

      // Update an existing feed
      updateFeed: (link, updatedFeed) =>
        set((state) => ({
          feeds: state.feeds.map((f) =>
            f.link === link ? { ...f, ...updatedFeed } : f
          ),
        })),

      // Set search query
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Get filtered feeds based on search query
      filteredFeeds: () => {
        const { feeds, searchQuery } = get();
        return feeds.filter((feed) =>
          feed.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      },

      // Reset feeds
      resetFeeds: () => set({ feeds: [] }),
    }),
    {
      name: "feed-storage",
    }
  )
);
