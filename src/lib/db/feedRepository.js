import { DbClient } from "./index.js";

/**
 * Feed database operations repository class
 * This class abstracts all database operations related to feeds
 */
export class FeedRepository {
  constructor() {
    this.db = new DbClient();
  }

  /**
   * Get user feeds
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Feed list
   */
  async getFeeds(userId) {
    try {
      const result = await this.db.query("feeds", {
        eq: { user_id: userId },
        order: { created_at: "desc" },
      });
      return result.data || [];
    } catch (error) {
      console.error("Error getting feeds:", error);
      return [];
    }
  }

  /**
   * Get feed items
   * @param {Array} feedIds - Feed IDs
   * @param {number} limit - Limit
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Feed items
   */
  async getFeedItems(feedIds, limit = 10, userId = null) {
    try {
      // Get RSS items
      const rssResult = await this.db.query("rss_items", {
        in: { feed_id: feedIds },
        order: { published_at: "desc" },
        limit: limit,
      });

      // Get YouTube items
      const ytResult = await this.db.query("youtube_items", {
        in: { feed_id: feedIds },
        order: { published_at: "desc" },
        limit: limit,
      });

      // Combine and sort results
      const combinedItems = [
        ...(rssResult.data || []).map((item) => ({
          ...item,
          type: "rss",
        })),
        ...(ytResult.data || []).map((item) => ({
          ...item,
          type: "youtube",
          url: `https://www.youtube.com/watch?v=${item.video_id}`,
        })),
      ];

      // Sort by published date
      combinedItems.sort((a, b) => {
        const dateA = new Date(a.published_at || 0);
        const dateB = new Date(b.published_at || 0);
        return dateB - dateA;
      });

      // Limit results
      return combinedItems.slice(0, limit);
    } catch (error) {
      console.error("Error getting feed items:", error);
      return [];
    }
  }

  /**
   * Get user's favorite items
   * @param {string} userId - User ID
   * @param {string} feedType - Feed type (rss or youtube)
   * @returns {Promise<Array>} - Favorite items
   */
  async getFavoriteItems(userId, feedType = "rss") {
    try {
      const interactionTable =
        feedType === "youtube" ? "youtube_interactions" : "rss_interactions";
      const itemsTable = feedType === "youtube" ? "youtube_items" : "rss_items";

      // Get interactions with is_favorite = true
      const result = await this.db.query(interactionTable, {
        eq: { user_id: userId, is_favorite: true },
        order: { created_at: "desc" },
      });

      if (!result.data || result.data.length === 0) {
        return [];
      }

      // Get item IDs from interactions
      const itemIds = result.data.map((interaction) => interaction.item_id);

      // Get actual items
      const itemsResult = await this.db.query(itemsTable, {
        in: { id: itemIds },
      });

      return itemsResult.data || [];
    } catch (error) {
      console.error("Error getting favorite items:", error);
      return [];
    }
  }

  /**
   * Get user's read later items
   * @param {string} userId - User ID
   * @param {string} feedType - Feed type (rss or youtube)
   * @returns {Promise<Array>} - Read later items
   */
  async getReadLaterItems(userId, feedType = "rss") {
    try {
      const interactionTable =
        feedType === "youtube" ? "youtube_interactions" : "rss_interactions";
      const itemsTable = feedType === "youtube" ? "youtube_items" : "rss_items";

      // Get interactions with is_read_later = true
      const result = await this.db.query(interactionTable, {
        eq: { user_id: userId, is_read_later: true },
        order: { created_at: "desc" },
      });

      if (!result.data || result.data.length === 0) {
        return [];
      }

      // Get item IDs from interactions
      const itemIds = result.data.map((interaction) => interaction.item_id);

      // Get actual items
      const itemsResult = await this.db.query(itemsTable, {
        in: { id: itemIds },
      });

      return itemsResult.data || [];
    } catch (error) {
      console.error("Error getting read later items:", error);
      return [];
    }
  }

  /**
   * Update item interaction
   * @param {string} userId - User ID
   * @param {string} itemId - Item ID
   * @param {string} feedType - Feed type
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} - Update result
   */
  async updateItemInteraction(userId, itemId, feedType, updates) {
    const table =
      feedType === "youtube" ? "youtube_interactions" : "rss_interactions";
    try {
      const result = await this.db.update(
        table,
        { eq: { user_id: userId, item_id: itemId } },
        updates
      );
      return result.data;
    } catch (error) {
      console.error("Error updating item interaction:", error);
      throw error;
    }
  }

  /**
   * Add new feed
   * @param {Object} feedData - Feed data
   * @returns {Promise<Object>} - Added feed
   */
  async addFeed(feedData) {
    try {
      const result = await this.db.insert("feeds", feedData);
      return result.data;
    } catch (error) {
      console.error("Error adding feed:", error);
      throw error;
    }
  }

  /**
   * Delete feed
   * @param {string} feedId - Feed ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Delete result
   */
  async deleteFeed(feedId, userId) {
    try {
      const result = await this.db.delete("feeds", {
        eq: { id: feedId, user_id: userId },
      });
      return result.data;
    } catch (error) {
      console.error("Error deleting feed:", error);
      throw error;
    }
  }

  /**
   * Clean up old items
   * @param {string} userId - User ID
   * @param {number} olderThanDays - How many days old
   * @param {boolean} keepFavorites - Keep favorites
   * @param {boolean} keepReadLater - Keep read later items
   * @returns {Promise<Object>} - Cleanup result
   */
  async cleanUpOldItems(
    userId,
    olderThanDays = 30,
    keepFavorites = true,
    keepReadLater = true
  ) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Handle RSS items
      const rssResult = await this.cleanupItemsByType(
        "rss_items",
        "rss_interactions",
        userId,
        cutoffDate,
        keepFavorites,
        keepReadLater
      );

      // Handle YouTube items
      const ytResult = await this.cleanupItemsByType(
        "youtube_items",
        "youtube_interactions",
        userId,
        cutoffDate,
        keepFavorites,
        keepReadLater
      );

      return {
        rss: rssResult,
        youtube: ytResult,
      };
    } catch (error) {
      console.error("Error cleaning up old items:", error);
      throw error;
    }
  }

  /**
   * Helper method to clean up items by type
   * @private
   */
  async cleanupItemsByType(
    itemsTable,
    interactionsTable,
    userId,
    cutoffDate,
    keepFavorites,
    keepReadLater
  ) {
    // Get items to exclude (favorites and read later)
    let excludeItemIds = [];

    if (keepFavorites || keepReadLater) {
      const conditions = [];
      if (keepFavorites) conditions.push({ is_favorite: true });
      if (keepReadLater) conditions.push({ is_read_later: true });

      const { data: interactions } = await this.db.query(interactionsTable, {
        eq: { user_id: userId },
        or: conditions,
      });

      if (interactions && interactions.length > 0) {
        excludeItemIds = interactions.map((i) => i.item_id);
      }
    }

    // Delete old items except excluded ones
    const result = await this.db.delete(itemsTable, {
      lt: { published_at: cutoffDate.toISOString() },
      not:
        excludeItemIds.length > 0 ? { id: { in: excludeItemIds } } : undefined,
    });

    return result.data;
  }

  /**
   * Get paginated feed items
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} pageSize - Page size
   * @param {Object} filters - Filters
   * @returns {Promise<Object>} - Paginated results
   */
  async getPaginatedFeedItems(userId, page = 1, pageSize = 12, filters = {}) {
    try {
      const offset = (page - 1) * pageSize;

      // Apply filters
      const queryConditions = {};

      if (filters.feedIds && filters.feedIds.length > 0) {
        queryConditions.in = { feed_id: filters.feedIds };
      }

      // Get RSS items
      const rssResult = await this.db.query("rss_items", {
        ...queryConditions,
        order: { published_at: "desc" },
        limit: pageSize,
        offset: offset,
      });

      // Get YouTube items
      const ytResult = await this.db.query("youtube_items", {
        ...queryConditions,
        order: { published_at: "desc" },
        limit: pageSize,
        offset: offset,
      });

      // Combine and sort results
      const combinedItems = [
        ...(rssResult.data || []).map((item) => ({
          ...item,
          type: "rss",
        })),
        ...(ytResult.data || []).map((item) => ({
          ...item,
          type: "youtube",
          url: `https://www.youtube.com/watch?v=${item.video_id}`,
        })),
      ];

      // Sort by published date
      combinedItems.sort((a, b) => {
        const dateA = new Date(a.published_at || 0);
        const dateB = new Date(b.published_at || 0);
        return dateB - dateA;
      });

      // Get total count for pagination
      const rssCount = await this.db.count("rss_items", queryConditions);
      const ytCount = await this.db.count("youtube_items", queryConditions);

      return {
        items: combinedItems.slice(0, pageSize),
        total: (rssCount || 0) + (ytCount || 0),
        page,
        pageSize,
      };
    } catch (error) {
      console.error("Error getting paginated feed items:", error);
      return {
        items: [],
        total: 0,
        page,
        pageSize,
      };
    }
  }

  /**
   * Get user interactions
   * @param {string} userId - User ID
   * @param {Array} itemIds - Item IDs
   * @param {string} feedType - Feed type (rss or youtube)
   * @returns {Promise<Array>} - Interactions
   */
  async getUserInteractions(userId, itemIds, feedType = "rss") {
    const table =
      feedType === "youtube" ? "youtube_interactions" : "rss_interactions";
    try {
      const result = await this.db.query(table, {
        eq: { user_id: userId },
        in: { item_id: itemIds },
      });
      return result.data || [];
    } catch (error) {
      console.error("Error getting user interactions:", error);
      return [];
    }
  }

  /**
   * Feed items to sync
   * @param {string} feedId - Feed ID
   * @param {string} userId - User ID
   * @param {string} feedType - Feed type
   * @param {Object} options - Options
   * @returns {Promise<Object>} - Sync result
   */
  async syncFeedItems(feedId, userId, feedType, options = {}) {
    try {
      // This method is for feed synchronization
      // For now, a simple implementation
      return { success: true, items: [] };
    } catch (error) {
      console.error("Error syncing feed items:", error);
      throw error;
    }
  }

  /**
   * Update feed last updated
   * @param {string} feedId - Feed ID
   * @returns {Promise<Object>} - Update result
   */
  async updateFeedLastUpdated(feedId) {
    try {
      const result = await this.db.update(
        "feeds",
        { eq: { id: feedId } },
        { last_updated: new Date().toISOString() }
      );
      return result.data;
    } catch (error) {
      console.error("Error updating feed last updated:", error);
      throw error;
    }
  }

  /**
   * Get feed type
   * @param {string} feedId - Feed ID
   * @returns {Promise<string>} - Feed type
   */
  async getFeedType(feedId) {
    try {
      const result = await this.db.query(
        "feeds",
        {
          eq: { id: feedId },
          select: "type",
        },
        true
      );
      return result.data?.type || "rss";
    } catch (error) {
      console.error("Error getting feed type:", error);
      return "rss";
    }
  }

  /**
   * Add RSS item
   * @param {Object} rssItemData - RSS item data
   * @returns {Promise<Object>} - Added item
   */
  async addRssItem(rssItemData) {
    try {
      const result = await this.db.insert("rss_items", rssItemData);
      return result.data;
    } catch (error) {
      console.error("Error adding RSS item:", error);
      throw error;
    }
  }

  /**
   * Add YouTube item
   * @param {Object} youtubeItemData - YouTube item data
   * @returns {Promise<Object>} - Added item
   */
  async addYoutubeItem(youtubeItemData) {
    try {
      const result = await this.db.insert("youtube_items", youtubeItemData);
      return result.data;
    } catch (error) {
      console.error("Error adding YouTube item:", error);
      throw error;
    }
  }
}
