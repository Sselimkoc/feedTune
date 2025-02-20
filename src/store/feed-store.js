import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useFeedStore = create(
  persist(
    (set, get) => ({
      feeds: [],
      searchQuery: "",
      
      // Add a new feed
      addFeed: (feed) => set((state) => ({ feeds: [...state.feeds, feed] })),
      
      // Remove a feed
      removeFeed: (id) => set((state) => ({
        feeds: state.feeds.filter((feed) => feed.id !== id),
      })),
      
      // Update an existing feed
      updateFeed: (id, updatedData) => set((state) => ({
        feeds: state.feeds.map((feed) => (feed.id === id ? { ...feed, ...updatedData } : feed)),
      })),
      
      // Persist feeds to local storage
      persistFeeds: () => {
        const { feeds } = get();
        localStorage.setItem("feeds", JSON.stringify(feeds));
      },
      
      // Load feeds from local storage
      loadFeeds: () => {
        const storedFeeds = localStorage.getItem("feeds");
        if (storedFeeds) {
          set({ feeds: JSON.parse(storedFeeds) });
        }
      },
      
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
      getStorage: () => localStorage,
    }
  )
);
