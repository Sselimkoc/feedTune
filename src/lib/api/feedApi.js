"use client";

export const feedApi = {
  fetchFeeds: async () => {
    const response = await fetch("/api/feeds", {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch feeds: ${response.status}`);
    }

    const data = await response.json();
    return data.feeds || [];
  },

  fetchItems: async () => {
    const response = await fetch("/api/feeds", {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.status}`);
    }

    const data = await response.json();
    return data.recentItems || [];
  },

  fetchFavorites: async () => {
    const response = await fetch("/api/favorites", {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch favorites: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  },

  fetchReadLater: async () => {
    const response = await fetch("/api/read-later", {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch read later items: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  },
};
