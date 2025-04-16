"use client";

import { feedRepository } from "@/repositories/feedRepository";
import { toast } from "sonner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * Feed işlemlerini yöneten servis katmanı.
 * Bu katman repository ile UI arasında aracılık yapar ve iş mantığını içerir.
 */
export class FeedService {
  constructor() {
    this.repository = feedRepository;
    this.supabase = createClientComponentClient();
  }

  /**
   * Kullanıcının feedlerini getirir
   * @param {string} userId Kullanıcı ID'si
   * @returns {Promise<Array>} Kullanıcının feedleri
   */
  async getFeeds(userId) {
    try {
      const timestamp = Date.now();
      return await this.repository.getFeeds(userId, timestamp);
    } catch (error) {
      console.error("Error fetching feed list:", error);
      toast.error("An error occurred while loading feeds.");
      return [];
    }
  }

  /**
   * Feed öğelerini getirir ve her feed için öğe sayısını sınırlar
   * @param {Array<string>} feedIds Feed ID'leri
   * @param {number} limit Her feed için maksimum öğe sayısı
   * @returns {Promise<Array>} Feed öğeleri
   */
  async getFeedItems(feedIds, limit = 10) {
    try {
      if (!feedIds || feedIds.length === 0) return [];

      const timestamp = Date.now();
      return await this.repository.getFeedItems(feedIds, limit, timestamp);
    } catch (error) {
      console.error("Error fetching feed items:", error);
      toast.error("An error occurred while loading feed content.");
      return [];
    }
  }

  /**
   * Kullanıcının favori öğelerini getirir
   * @param {string} userId Kullanıcı ID'si
   * @returns {Promise<Array>} Favori öğeler
   */
  async getFavorites(userId) {
    try {
      const timestamp = Date.now();
      return await this.repository.getFavoriteItems(userId, timestamp);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast.error("An error occurred while loading favorites.");
      return [];
    }
  }

  /**
   * Kullanıcının daha sonra okuma listesindeki öğeleri getirir
   * @param {string} userId Kullanıcı ID'si
   * @returns {Promise<Array>} Daha sonra okunacak öğeler
   */
  async getReadLaterItems(userId) {
    try {
      const timestamp = Date.now();
      return await this.repository.getReadLaterItems(userId, timestamp);
    } catch (error) {
      console.error("Error fetching read later list:", error);
      toast.error("An error occurred while loading read later list.");
      return [];
    }
  }

  /**
   * Öğe okundu/okunmadı durumunu değiştirir
   * @param {string} userId Kullanıcı ID'si
   * @param {string} itemId Öğe ID'si
   * @param {boolean} isRead Okundu durumu
   * @returns {Promise<object>} Güncellenen veri
   */
  async toggleItemReadStatus(userId, itemId, isRead) {
    try {
      return await this.repository.updateItemInteraction(userId, itemId, {
        is_read: isRead,
      });
    } catch (error) {
      console.error("Error updating read status:", error);
      toast.error("An error occurred while updating read status.");
      throw error;
    }
  }

  /**
   * Öğe favori durumunu değiştirir
   * @param {string} userId Kullanıcı ID'si
   * @param {string} itemId Öğe ID'si
   * @param {boolean} isFavorite Favori durumu
   * @returns {Promise<object>} Güncellenen veri
   */
  async toggleItemFavoriteStatus(userId, itemId, isFavorite) {
    try {
      return await this.repository.updateItemInteraction(userId, itemId, {
        is_favorite: isFavorite,
      });
    } catch (error) {
      console.error("Error updating favorite status:", error);
      toast.error("An error occurred while updating favorite status.");
      throw error;
    }
  }

  /**
   * Öğe daha sonra oku durumunu değiştirir
   * @param {string} userId Kullanıcı ID'si
   * @param {string} itemId Öğe ID'si
   * @param {boolean} isReadLater Daha sonra oku durumu
   * @returns {Promise<object>} Güncellenen veri
   */
  async toggleItemReadLaterStatus(userId, itemId, isReadLater) {
    try {
      return await this.repository.updateItemInteraction(userId, itemId, {
        is_read_later: isReadLater,
      });
    } catch (error) {
      console.error("Error updating read later status:", error);
      toast.error("An error occurred while updating read later status.");
      throw error;
    }
  }

  /**
   * Feed ekler (RSS veya YouTube)
   * @param {string} url Feed URL'si veya YouTube kanal bağlantısı
   * @param {string} type Feed türü (rss, youtube)
   * @param {string} userId Kullanıcı ID'si
   * @returns {Promise<object>} Eklenen feed
   */
  async addFeed(url, type, userId) {
    try {
      if (!userId) throw new Error("User ID is required");
      if (!url) throw new Error("Feed URL is required");
      if (!type) throw new Error("Feed type is required");

      // URL validation
      let feedUrl = url;
      try {
        new URL(url);
      } catch (e) {
        throw new Error("Please enter a valid URL");
      }

      // YouTube URL handling
      if (type === "youtube" && url.includes("youtube.com")) {
        try {
          const youtubeUrl = new URL(url);
          if (youtubeUrl.pathname.includes("/channel/")) {
            const channelId = youtubeUrl.pathname.split("/channel/")[1];
            feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
          } else if (
            youtubeUrl.pathname.includes("/c/") ||
            youtubeUrl.pathname.includes("/@")
          ) {
            // For channel name format, we can use as is - the server will handle conversion
            feedUrl = `https://www.youtube.com/feeds/videos.xml?channel=${youtubeUrl.pathname.slice(
              1
            )}`;
          }
        } catch (e) {
          throw new Error("Please enter a valid YouTube URL");
        }
      }

      // Repository call
      return await this.repository.addFeed({
        url: feedUrl,
        user_id: userId,
        type: type,
        is_active: true,
      });
    } catch (error) {
      console.error("Error adding feed:", error);
      throw error;
    }
  }

  /**
   * Feed siler
   * @param {string} feedId Feed ID'si
   * @param {string} userId Kullanıcı ID'si
   * @returns {Promise<boolean>} İşlem başarılı mı?
   */
  async deleteFeed(feedId, userId) {
    try {
      if (!userId) throw new Error("User ID is required");
      if (!feedId) throw new Error("Feed ID is required");

      // Check if the feed belongs to the user
      const userFeeds = await this.repository.getFeeds(userId);
      const feedExists = userFeeds.some((feed) => feed.id === feedId);

      if (!feedExists) {
        throw new Error("This feed doesn't exist or doesn't belong to you");
      }

      // Execute the operation
      return await this.repository.deleteFeed(feedId, userId);
    } catch (error) {
      console.error("Error deleting feed:", error);
      throw error;
    }
  }

  /**
   * Eski içerikleri temizler
   * @param {string} userId Kullanıcı ID'si
   * @param {number} olderThanDays Belirtilen günden daha eski öğeleri siler (varsayılan: 30 gün)
   * @param {boolean} keepFavorites Favorileri korur (varsayılan: true)
   * @param {boolean} keepReadLater "Sonra Oku" olarak işaretlenmiş öğeleri korur (varsayılan: true)
   * @returns {Promise<{deleted: number, error: any}>} Silinen öğe sayısı ve varsa hata bilgisi
   */
  async cleanUpOldItems(
    userId,
    olderThanDays = 30,
    keepFavorites = true,
    keepReadLater = true
  ) {
    try {
      if (!userId) throw new Error("User ID is required");

      const result = await this.repository.cleanUpOldItems(
        userId,
        olderThanDays,
        keepFavorites,
        keepReadLater
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      console.error("Error cleaning up old items:", error);
      throw error;
    }
  }

  /**
   * Her feed için öğe sayısını sınırlar
   * @param {Array} feeds Feed'ler
   * @param {Array} items Öğeler
   * @param {number} limit Her feed başına maksimum öğe sayısı
   * @returns {Array} Sınırlandırılmış öğeler
   */
  limitItemsPerFeed(feeds, items, limit = 12) {
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
      limitedItems.push(...feedItems.slice(0, limit));
    });

    return { feeds, items: limitedItems };
  }

  /**
   * Sayfalı olarak feed öğelerini getirir
   * @param {string} userId Kullanıcı ID'si
   * @param {number} page Sayfa numarası
   * @param {number} pageSize Sayfa başına öğe sayısı
   * @param {Object} filters Filtre parametreleri
   * @returns {Promise<Object>} Sayfalı feed öğeleri
   */
  async getPaginatedFeedItems(userId, page = 1, pageSize = 12, filters = {}) {
    try {
      if (!userId) {
        console.log("User ID not found");
        return { data: [], total: 0, hasMore: false };
      }

      // Get the user's feeds first
      const feeds = await this.getFeeds(userId);
      console.log("User feeds:", feeds?.length || 0);

      if (!feeds || feeds.length === 0) {
        console.log("No feeds found for user");
        return { data: [], total: 0, hasMore: false };
      }

      // Extract feed IDs
      let feedIds = feeds.map((feed) => feed.id);

      // Log filtering operations
      console.log("Starting filtering:", {
        selectedFeedId: filters.selectedFeedId,
        feedType: filters.feedType,
      });

      // Filter by selected feed (highest priority)
      if (filters.selectedFeedId) {
        console.log("Selected feed:", filters.selectedFeedId);
        feedIds = [filters.selectedFeedId];
        // If the selected feed is not found, return empty result
        if (!feeds.some((feed) => feed.id === filters.selectedFeedId)) {
          console.log("Selected feed not found");
          return { data: [], total: 0, hasMore: false };
        }
      }
      // If no feed is selected and feed type is specified, filter by type
      else if (filters.feedType && filters.feedType !== "all") {
        console.log("Feed type filter:", filters.feedType);
        const filteredFeeds = feeds.filter(
          (feed) => feed.type === filters.feedType
        );
        if (filteredFeeds.length === 0) {
          console.log("No feeds found for specified type");
          return { data: [], total: 0, hasMore: false };
        }
        feedIds = filteredFeeds.map((feed) => feed.id);
      }

      // Call repository
      console.log("Parameters sent to repository:", {
        feedIds,
        page,
        pageSize,
        filters,
      });

      const result = await this.repository.getPaginatedFeedItems(
        feedIds,
        page,
        pageSize,
        filters
      );

      console.log("Result from repository:", {
        itemCount: result.data?.length || 0,
        total: result.total,
        hasMore: result.hasMore,
      });

      return result;
    } catch (error) {
      console.error("Error fetching feed items:", error);
      throw error;
    }
  }

  /**
   * Toggles the read status of an item
   * @param {string} itemId Item ID
   * @param {boolean} isRead Read status
   * @returns {Promise<object>} Updated data
   */
  async toggleRead(itemId, isRead) {
    try {
      if (!itemId) throw new Error("Item ID is required");

      // Get the user ID from auth
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      return await this.toggleItemReadStatus(user.id, itemId, isRead);
    } catch (error) {
      console.error("Error toggling read status:", error);
      throw error;
    }
  }

  /**
   * Toggles the favorite status of an item
   * @param {string} itemId Item ID
   * @param {boolean} isFavorite Favorite status
   * @returns {Promise<object>} Updated data
   */
  async toggleFavorite(itemId, isFavorite) {
    try {
      if (!itemId) throw new Error("Item ID is required");

      // Get the user ID from auth
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      return await this.toggleItemFavoriteStatus(user.id, itemId, isFavorite);
    } catch (error) {
      console.error("Error toggling favorite status:", error);
      throw error;
    }
  }

  /**
   * Toggles the read later status of an item
   * @param {string} itemId Item ID
   * @param {boolean} isReadLater Read later status
   * @returns {Promise<object>} Updated data
   */
  async toggleReadLater(itemId, isReadLater) {
    try {
      if (!itemId) throw new Error("Item ID is required");

      // Get the user ID from auth
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      return await this.toggleItemReadLaterStatus(user.id, itemId, isReadLater);
    } catch (error) {
      console.error("Error toggling read later status:", error);
      throw error;
    }
  }
}

// Singleton instance - Uygulama boyunca tek bir örnek kullanmak için
export const feedService = new FeedService();
